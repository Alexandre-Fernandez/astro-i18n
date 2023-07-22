import { throwFalsy } from "@lib/error"
import Interpolation from "@src/core/translation/classes/interpolation.class"
import Variant from "@src/core/translation/classes/variant.class"
import NonStringVariant from "@src/core/translation/errors/variant/non-string-variant.error"
import {
	INTERPOLATION_PATTERN,
	VARIANT_PATTERN,
} from "@src/core/translation/constants/translation-patterns.constants"
import { TRANSLATION_KEY_SEPARATOR } from "@src/core/translation/constants/translation.constants"
import type {
	ComputedTranslations,
	DeepStringRecord,
	Formatters,
	TranslationProperties,
} from "@src/core/translation/types"

/**
 * Transforms a DeepStringRecord into ComputedTranslations.
 * Basically it flattens the DeepStringRecord and groups variants together.
 */
export function computeDeepStringRecord(
	deepStringRecord: DeepStringRecord,
	path = "",
	computed: ComputedTranslations = {},
) {
	for (const [curKey, curValue] of Object.entries(deepStringRecord)) {
		if (typeof curValue === "string") {
			const { match, range } = VARIANT_PATTERN.match(curKey) || {}
			// no variant => default
			if (!match?.[1] || !range) {
				const key =
					`${path}${TRANSLATION_KEY_SEPARATOR}${curKey}`.replace(
						/^\./,
						"",
					)

				if (computed[key]) {
					computed[key]!.default = curValue
					continue
				}
				computed[key] = {
					default: curValue,
					variants: [],
				}
				continue
			}
			// variant
			const key = `${path}${TRANSLATION_KEY_SEPARATOR}${
				curKey.slice(0, range[0]) + curKey.slice(range[1])
			}`.replace(/^\./, "")

			if (computed[key]) {
				computed[key]!.variants.push(new Variant(match[1], curValue))
				continue
			}
			computed[key] = {
				variants: [new Variant(match[1], curValue)],
			}
			continue
		}

		if (VARIANT_PATTERN.test(curKey)) throw new NonStringVariant()

		computeDeepStringRecord(
			curValue,
			`${path}${TRANSLATION_KEY_SEPARATOR}${curKey}`.replace(/^\./, ""),
			computed,
		)
	}

	return computed
}

/**
 * Resolves every interpolation in the given string.
 */
export function interpolate(
	translation: string,
	properties: TranslationProperties,
	formatters: Formatters,
) {
	const results: { value: string; range: [number, number] }[] = []

	INTERPOLATION_PATTERN.exec(translation, ({ match, range }) => {
		if (!match[1]) return

		const { value } = new Interpolation(match[1], properties, formatters)

		results.push({ value: unknowntoString(value), range })
	})

	let interpolated = translation

	for (let i = results.length - 1; i >= 0; i -= 1) {
		const { value, range } = results[i] || throwFalsy()
		interpolated =
			interpolated.slice(0, range[0]) +
			value +
			interpolated.slice(range[1])
	}

	return interpolated
}

/**
 * Finds the best way to represent the unknown value as a string.
 */
export function unknowntoString(value: unknown) {
	switch (typeof value) {
		case "undefined": {
			return ""
		}
		case "string": {
			return value
		}
		case "bigint": {
			return value.toString()
		}
		case "number": {
			return value.toString()
		}
		case "boolean": {
			return value.toString()
		}
		case "symbol": {
			return `Symbol(${value.description})` || "Symbol"
		}
		case "function": {
			return value.name
		}
		case "object": {
			if (!value) return "" // null
			if (
				Object.hasOwn(value, "toString") &&
				typeof value.toString === "function"
			) {
				return value.toString()
			}
			return JSON.stringify(value, null, "\t")
		}
		default: {
			return ""
		}
	}
}

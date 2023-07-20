import { throwFalsy } from "@lib/error"
import {
	INTERPOLATION_PATTERN,
	VARIANT_PATTERN,
} from "@src/constants/patterns.constants"
import Interpolation from "@src/core/translation/classes/interpolation.class"
import Variant from "@src/core/translation/classes/variant.class"
import NonStringVariant from "@src/core/translation/errors/non-string-variant.error"
import type {
	ComputedTranslations,
	DeepStringRecord,
	TranslationProperties,
} from "@src/core/translation/types"

/*
	{
		[key: string]: string | DeepStringRecord;
	}
		====>
	{
		[key: string]: {
			default?: string
			variants: Variant[]
		}
	}
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
				const key = `${path}.${curKey}`.replace(/^\./, "")

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
			const key = `${path}.${
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
			`${path}.${curKey}`.replace(/^\./, ""),
			computed,
		)
	}

	return computed
}

export function interpolate(
	translation: string,
	properties: TranslationProperties,
) {
	const results: { value: string; range: [number, number] }[] = []

	INTERPOLATION_PATTERN.exec(translation, ({ match, range }) => {
		if (!match[1]) return

		const { value } = new Interpolation(
			match[1],
			properties,
			{} /* TODO: add formaters */,
		)

		switch (typeof value) {
			case "undefined": {
				results.push({ value: "", range })
				break
			}
			case "string": {
				results.push({ value, range })
				break
			}
			case "bigint": {
				results.push({ value: value.toString(), range })
				break
			}
			case "number": {
				results.push({ value: value.toString(), range })
				break
			}
			case "boolean": {
				results.push({ value: value.toString(), range })
				break
			}
			case "symbol": {
				results.push({ value: value.description || "", range })
				break
			}
			case "function": {
				results.push({ value: "", range })
				break
			}
			case "object": {
				if (!value) {
					results.push({ value: "", range })
					break
				}
				if (
					Object.hasOwn(value, "toString") &&
					typeof value.toString === "function"
				) {
					results.push({ value: `${value.toString()}`, range })
					break
				}
				results.push({
					value: JSON.stringify(value, null, "\t"),
					range,
				})
				break
			}
			default: {
				break
			}
		}
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

import { objectEntries } from "$lib/typescript-helpers"
import { execOnce, replaceRange } from "$lib/string"
import { PATH_SEPARATOR } from "$src/constants"
import astroI18n from "$src/core/state"
import {
	parseInterpolations,
	parseTranslationKey,
	variantPattern,
} from "$src/core/translation/parsers"
import type {
	ParsedFormatter,
	ParsedInterpolation,
	TranslationKey,
	TranslationVariant,
} from "$src/types/app"
import type { Translation, TranslationMap } from "$src/types/config"

export function t(
	path: string,
	options?: Record<string, unknown>,
	langCode = astroI18n.langCode,
) {
	if (!options) {
		return getTranslationValue(path, langCode)
	}
	const translationValue = getTranslationValue(
		getBestVariantPath(
			path,
			astroI18n.internals().translationVariants,
			options,
		),
		langCode,
	)
	return replaceInterpolations(translationValue, options)
}

/**
 * @returns All the translation variants in `translations`.
 */
export function getTranslationVariants(translations: TranslationMap) {
	const translationVariants: Record<string, TranslationVariant[]> = {}

	const visited = new Set<string>()
	forEachTranslation(translations, (path, { variant }) => {
		if (!variant) return
		const translationVariantPath = getTranslationVariantPath(path, variant)
		if (visited.has(translationVariantPath)) return

		if (!translationVariants[path]) translationVariants[path] = []
		translationVariants[path].push(variant)
		visited.add(translationVariantPath)
	})
	return translationVariants
}

/**
 * @returns The normalized translation path corresponding to `translationPath` & `variant`.
 */
function getTranslationVariantPath(
	translationPath: string,
	variant: TranslationVariant,
) {
	const i = translationPath.lastIndexOf(PATH_SEPARATOR)
	if (i < 0) return variant.name
	return `${translationPath.slice(0, i)}${PATH_SEPARATOR}${variant.name}`
}

/**
 * Calls `callback` once for every translation in `translations` (skips the root
 * properties which should be lang codes).
 */
export function forEachTranslation(
	translations: TranslationMap | Record<string, Translation>,
	callback: (
		path: string,
		key: TranslationKey,
		interpolations: ParsedInterpolation[],
	) => void,
	cache?: { path: string; first: boolean },
) {
	const { path, first } = { path: "", first: true, ...cache }

	for (const [property, value] of objectEntries(translations)) {
		const translationKey = parseTranslationKey(property)

		// `value` is a translation
		if (typeof value === "string") {
			callback(
				`${path}${translationKey.name}`,
				translationKey,
				parseInterpolations(value),
			)
			continue
		}
		// first iteration, `key` is a lang code
		if (first) {
			forEachTranslation(value, callback, {
				path: "",
				first: false,
			})
			continue
		}
		// nested translation object
		forEachTranslation(value, callback, {
			path: `${path}${translationKey.name}${PATH_SEPARATOR}`,
			first: false,
		})
	}
}

/**
 * @returns The best matching variant of `path` for the given `options`.
 */
function getBestVariantPath(
	path: string,
	variants: Record<string, TranslationVariant[]>,
	options: undefined | Record<string, unknown>,
) {
	if (!variants[path]) return path

	const current = {
		score: 0,
		variant: undefined as undefined | TranslationVariant,
	}

	for (const variant of variants[path]) {
		const score = calculateVariantScore(variant, options)
		if (score > current.score) {
			current.score = score
			current.variant = variant
		}
	}

	if (current.variant) return getTranslationVariantPath(path, current.variant)
	return path
}

/**
 * Calculates the matching score for the given `variant` & `options`.
 */
function calculateVariantScore(
	variant: TranslationVariant,
	options: undefined | Record<string, unknown>,
) {
	let score = 0

	if (options) {
		for (const { name, value } of variant.properties) {
			const option = options[name]
			if (option == null) continue
			if (typeof option === "string" && option === value) {
				score += 1
			}
			if (typeof option === "number" && typeof value === "number") {
				score += Math.abs(1 / (option - value))
			}
		}
	} else if (variant.properties.length === 0) {
		score += 1
	}

	return score
}

/**
 * Replaces all the interpolations contained in `translationValue` by their
 * actual value.
 * @param translationValue The translation value retrieved with the translation
 * path.
 */
function replaceInterpolations(
	translationValue: string,
	options: Record<string, unknown>,
) {
	const interpolations = parseInterpolations(translationValue)
	if (interpolations.length === 0) return translationValue

	let replaced = translationValue
	for (const {
		name,
		default: defaultValue,
		formatters,
		range,
	} of interpolations) {
		if (!options || !options[name]) {
			// no default value > remove interpolation / else use it to interpolate
			if (defaultValue === undefined) {
				replaced = replaceRange(replaced, range[0], range[1], "")
				continue
			}
			replaced = replaceRange(
				replaced,
				range[0],
				range[1],
				getFormattedValue(defaultValue, formatters, options),
			)
			continue
		}

		replaced = replaceRange(
			replaced,
			range[0],
			range[1],
			getFormattedValue(options[name], formatters, options),
		)
	}
	return replaced
}

/**
 * @returns The resulting `value` after passing it through all the
 * `parsedFormatters` available in `availableFormatters`.
 */
function getFormattedValue(
	value: unknown,
	parsedFormatters: ParsedFormatter[],
	options: Record<string, unknown>,
	availableFormatters = astroI18n.formatters,
) {
	return String(
		parsedFormatters.reduce((prev, { name, arguments: args }) => {
			if (!availableFormatters[name]) return prev
			return availableFormatters[name](
				prev,
				...args.map((arg) => arg.getter(options)),
			)
		}, value),
	)
}

/**
 * @returns The corresponding value from `translations` using `langCode` &
 * `path`.
 */
function getTranslationValue(
	path: string,
	langCode = astroI18n.langCode,
	translations = astroI18n.translations,
) {
	if (typeof translations[langCode][path] === "string") {
		return translations[langCode][path] as string
	}
	const translation = splitTranslationPath(path).reduce((prev, prop) => {
		if (prev === undefined) return undefined
		if (typeof prev === "string") return prev
		return prev[prop]
	}, translations[langCode] as Translation | undefined)

	if (typeof translation !== "string") return path // undefined or translation object
	return translation
}

/**
 * Splits a translation path including the variant, e.g.
 * `"my.path{variant:'my.variant'}"` => `["my", "path{variant:'my.variant'}"]`.
 */
function splitTranslationPath(path: string) {
	const exec = execOnce(variantPattern, path)
	if (!exec) return path.split(PATH_SEPARATOR)
	const { match, range } = exec
	const placeholder = "{-}"
	// removing variant > splitting > adding back variant at the `placeholder` position
	return replaceRange(path, range[0], range[0] + match[0].length, placeholder)
		.split(PATH_SEPARATOR)
		.map((s) => s.replace(placeholder, match[0]))
}

import {
	isObjectLiteral,
	isStringArray,
	isStringStringRecord,
} from "$lib/typescript-helpers"
import { DEFAULT_CONFIG_NAME } from "$src/constants"
import type {
	Translation,
	UninitializedAstroI18nConfig,
	UninitializedRouteTranslationMap,
	UninitializedTranslationMap,
} from "$src/types/config"

export function assertIsPartialUninitializedAstroI18nConfig(
	subject: unknown,
): asserts subject is Partial<UninitializedAstroI18nConfig> {
	if (!isObjectLiteral(subject)) {
		throw new TypeError(`${DEFAULT_CONFIG_NAME} is not an object literal.`)
	}

	// defaultLangCode
	if (
		subject.defaultLangCode &&
		typeof subject.defaultLangCode !== "string"
	) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.defaultLangCode must be of type string.`,
		)
	}

	// supportedLangCodes
	if (
		subject.supportedLangCodes &&
		!isStringArray(subject.supportedLangCodes)
	) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.supportedLangCodes must be an array of strings.`,
		)
	}

	// showDefaultLangCode
	if (
		subject.showDefaultLangCode !== undefined &&
		typeof subject.showDefaultLangCode !== "boolean"
	) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.showDefaultLangCode must be of type boolean.`,
		)
	}

	// trailingSlash
	if (
		subject.trailingSlash !== undefined &&
		!(subject.trailingSlash == "always" || subject.trailingSlash == "never")
	) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.trailingSlash must be "always" or "never".`,
		)
	}

	// translations
	if (subject.translations) {
		assertIsUninitializedTranslationMap(
			subject.translations,
			subject.defaultLangCode,
			subject.supportedLangCodes,
		)
	}

	// routeTranslations
	if (subject.routeTranslations) {
		assertIsUninitializedRouteTranslationMap(
			subject.routeTranslations,
			subject.defaultLangCode,
		)
	}
}

function assertIsUninitializedTranslationMap(
	subject: unknown,
	defaultLangCode: unknown,
	supportedLangCodes: unknown,
): asserts subject is UninitializedTranslationMap {
	if (!isObjectLiteral(subject)) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.translations must be an object literal.`,
		)
	}

	const langCodes: string[] = []
	if (typeof defaultLangCode === "string") langCodes.push(defaultLangCode)
	if (isStringArray(supportedLangCodes)) langCodes.push(...supportedLangCodes)

	for (const [lang, root] of Object.entries(subject)) {
		if (langCodes.length > 0 && !langCodes.includes(lang)) {
			throw new TypeError(
				`${DEFAULT_CONFIG_NAME}.translations.${lang}, unsupported lang code.\nAdd "${lang}" to ${DEFAULT_CONFIG_NAME}.supportedLangCodes or ${DEFAULT_CONFIG_NAME}.defaultLangCode).`,
			)
		}

		if (typeof root === "string") continue
		if (!isObjectLiteral(root)) {
			throw new TypeError(
				`${DEFAULT_CONFIG_NAME}.translations.${lang} must be either a translation object or a (string) path to a json one.`,
			)
		}
		for (const [, translation] of Object.entries(root)) {
			assertIsTranslation(translation)
		}
	}
}

function assertIsUninitializedRouteTranslationMap(
	subject: unknown,
	supportedLangCodes: unknown,
): asserts subject is UninitializedRouteTranslationMap {
	if (!isObjectLiteral(subject)) {
		throw new TypeError(
			`${DEFAULT_CONFIG_NAME}.routeTranslations must be an object literal.`,
		)
	}

	const langCodes: string[] = []
	if (isStringArray(supportedLangCodes)) langCodes.push(...supportedLangCodes)

	for (const [lang, translation] of Object.entries(subject)) {
		if (langCodes.length > 0 && !langCodes.includes(lang)) {
			throw new TypeError(
				`${DEFAULT_CONFIG_NAME}.routeTranslations.${lang}, unsupported lang code.\nAdd "${lang}" to ${DEFAULT_CONFIG_NAME}.supportedLangCodes).`,
			)
		}

		if (
			typeof translation !== "string" &&
			!isStringStringRecord(translation)
		) {
			throw new TypeError(
				`${DEFAULT_CONFIG_NAME}.routeTranslations.${lang} must be either a Record<string, string> or a (string) path to a json one.`,
			)
		}
	}
}

export function isTranslation(subject: unknown): subject is Translation {
	if (typeof subject === "string") return true
	if (!isObjectLiteral(subject)) return false
	for (const translation of Object.values(subject)) {
		if (!isTranslation(translation)) return false
	}
	return true
}

export function assertIsTranslation(
	subject: unknown,
): asserts subject is Translation {
	if (typeof subject === "string") return
	if (!isObjectLiteral(subject)) {
		throw new TypeError(
			`"${subject}" must be either a string or a translation object.`,
		)
	}
	for (const translation of Object.values(subject)) {
		assertIsTranslation(translation)
	}
}

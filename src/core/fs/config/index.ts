import getFileExports from "get-file-exports"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import {
	getFileExtension,
	getFileNameAndExtension,
	importJson,
	isDirectory,
	isFile,
	joinExists,
} from "$lib/filesystem"
import {
	assertIsInArray,
	assertIsStringStringRecord,
	objectEntries,
} from "$lib/typescript-helpers"
import { DEFAULT_CONFIG_NAME } from "$src/constants"
import {
	assertIsPartialUninitializedAstroI18nConfig,
	isTranslation,
} from "$src/types/guards"
import type {
	AstroI18nConfig,
	RouteTranslationMap,
	TranslationMap,
	UninitializedAstroI18nConfig,
	UninitializedRouteTranslationMap,
	UninitializedTranslationMap,
} from "$src/types/config"

const configExtensions = new Set([
	"json",
	"js",
	"cjs",
	"mjs",
	"ts",
	"cts",
	"mts",
])

const defaultConfig: AstroI18nConfig = {
	defaultLangCode: "en",
	supportedLangCodes: [],
	showDefaultLangCode: false,
	trailingSlash: "never",
	translations: {},
	routeTranslations: {},
}

export function getDefaultConfig() {
	return { ...defaultConfig }
}

/**
 * Autocomplete helper to create the astro-i18n config.
 */
export function defineAstroI18nConfig(
	astroI18nConfig: Partial<UninitializedAstroI18nConfig>,
) {
	return astroI18nConfig
}

/**
 * Loads the astro-i18n config from the filesystem and returns it.
 * @param pathToConfig If provided this absolute path will override the
 * astro-i18n config search location.
 */
export async function loadAstroI18nConfig(root: string, pathToConfig = "") {
	const path = getAstroI18nConfigPath(root, pathToConfig)

	const partialUninitializedAstroI18nConfig = path.endsWith(".json")
		? importJson(path)
		: (await getFileExports(path)).default

	assertIsPartialUninitializedAstroI18nConfig(
		partialUninitializedAstroI18nConfig,
	)

	return initializeAstroI18nConfig(partialUninitializedAstroI18nConfig, root)
}

/**
 * @returns A correct path to the astro-i18n config file.
 */
function getAstroI18nConfigPath(root: string, pathToConfig = "") {
	if (pathToConfig) {
		if (!isFile(pathToConfig)) {
			throw new Error(`${pathToConfig} is not an astro-i18n config file.`)
		}
		const extension = getFileExtension(pathToConfig)
		if (!configExtensions.has(extension)) {
			throw new Error(
				`The astro-i18n config file must be a JavaScript or TypeScript file (found "${extension}").`,
			)
		}
		return pathToConfig
	}

	if (!isDirectory(root)) {
		throw new Error(`${root} is not the project's root directory.`)
	}
	for (const content of readdirSync(root)) {
		const [name, extension] = getFileNameAndExtension(content)
		if (!configExtensions.has(extension)) continue
		if (name === DEFAULT_CONFIG_NAME) return join(root, content)
	}

	throw new Error(
		`Could not resolve the astro-i18n config file, verify that you have a ${DEFAULT_CONFIG_NAME}<.js/.ts> file in your project root directory "${root}".`,
	)
}

/**
 * Initialize a configuration and fills all missing properties with the default
 * configuration values.
 */
function initializeAstroI18nConfig(
	{
		defaultLangCode,
		supportedLangCodes,
		showDefaultLangCode,
		trailingSlash,
		translations,
		routeTranslations,
	}: Partial<UninitializedAstroI18nConfig> = {},
	root = "",
) {
	const config = getDefaultConfig()

	if (defaultLangCode) config.defaultLangCode = defaultLangCode
	if (supportedLangCodes) config.supportedLangCodes = supportedLangCodes
	if (showDefaultLangCode !== undefined) {
		config.showDefaultLangCode = showDefaultLangCode
	}
	if (trailingSlash) config.trailingSlash = trailingSlash
	if (root) {
		const langCodes = [config.defaultLangCode, ...config.supportedLangCodes]
		if (translations) {
			config.translations = initializeTranslations(
				translations,
				langCodes,
				root,
			)
		}
		if (routeTranslations) {
			config.routeTranslations = initializeRouteTranslations(
				routeTranslations,
				langCodes,
				root,
			)
		}
	}

	// initializing lang codes keys in translations
	for (const langCode of config.supportedLangCodes) {
		if (!config.routeTranslations[langCode]) {
			config.routeTranslations[langCode] = {}
		}
	}
	for (const langCode of [
		config.defaultLangCode,
		...config.supportedLangCodes,
	]) {
		if (!config.translations[langCode]) config.translations[langCode] = {}
	}

	return config
}

/**
 * Imports and verifies all translation file paths.
 */
function initializeTranslations(
	uninitializedTranslations: UninitializedTranslationMap,
	langCodes: string[],
	root: string,
) {
	const initializedTranslations: TranslationMap = {}

	for (const [langCode, translation] of objectEntries(
		uninitializedTranslations,
	)) {
		assertIsInArray(langCodes, langCode)

		if (typeof translation === "string") {
			const translationPath = joinExists(root, translation)
			const importedTranslations = importJson(translationPath)

			if (!importedTranslations) {
				throw new Error(
					`Failed to load astroI18nConfig.translations.${langCode} (${translationPath}), make sure that it's valid JSON.`,
				)
			}
			if (
				!isTranslation(importedTranslations) ||
				typeof importedTranslations === "string"
			) {
				throw new TypeError(
					`astroI18nConfig.translations.${langCode} is not a valid translation object.`,
				)
			}

			initializedTranslations[langCode] = importedTranslations
		} else {
			initializedTranslations[langCode] = translation
		}
	}

	return initializedTranslations
}

/**
 * Imports and verifies all route translation file paths.
 */
function initializeRouteTranslations(
	uninitializedTranslations: UninitializedRouteTranslationMap,
	langCodes: string[],
	root: string,
) {
	const initializedRouteTranslations: RouteTranslationMap = {}

	for (const [langCode, routeTranslation] of objectEntries(
		uninitializedTranslations,
	)) {
		assertIsInArray(langCodes, langCode)

		if (typeof routeTranslation === "string") {
			const routeTranslationPath = joinExists(root, routeTranslation)
			const importedRouteTranslations = importJson(routeTranslationPath)

			if (!importedRouteTranslations) {
				throw new Error(
					`Failed to load astroI18nConfig.routeTranslation.${langCode} (${routeTranslationPath}), make sure that it's valid JSON.`,
				)
			}
			assertIsStringStringRecord(importedRouteTranslations)

			initializedRouteTranslations[langCode] = importedRouteTranslations
		} else {
			initializedRouteTranslations[langCode] = routeTranslation
		}
	}

	return initializedRouteTranslations
}

import { readdirSync, readFileSync } from "node:fs"
import { join, sep } from "node:path"
import {
	forEachDirectory,
	getFileName,
	importJson,
	isDirectory,
	isFile,
	joinExists,
	splitFileName,
} from "$lib/filesystem"
import { addNestedProperty, merge } from "$lib/object-literal"
import { splitAt } from "$lib/string"
import { isTranslation } from "$src/types/guards"
import {
	ASTRO_ENV_DTS,
	ASTRO_I18N_DIRECTORY,
	COMPONENT_EXTENSION,
	GENERATED_DTS,
	PAGE_TRANSLATION_DIRECTORY,
	ROUTE_TRANSLATION_KEY,
	TSCONFIG_JSON,
} from "$src/constants"
import type {
	AstroI18nConfig,
	RouteTranslationMap,
	TranslationMap,
} from "$src/types/config"
import type { PageInfo } from "$src/types/app"

export function isTypescriptProject(projectRoot: string) {
	const tsconfig = join(projectRoot, TSCONFIG_JSON)
	return isFile(tsconfig)
}

export function getGeneratedDtsRootRelativePath() {
	return join(ASTRO_I18N_DIRECTORY, GENERATED_DTS)
}

export function getPagesDirectoryRootRelativePath() {
	return join("src", "pages")
}

export function getEnvDtsRootRelativePath() {
	return join("src", ASTRO_ENV_DTS)
}

/**
 * Reads the astro pages directory and their metadata.
 */
export function getPagesMetadata(
	root: string,
	astroI18nConfig: AstroI18nConfig,
) {
	const { defaultLangCode, supportedLangCodes } = astroI18nConfig
	const pagesDirectory = joinExists(root, getPagesDirectoryRootRelativePath())
	const routePageInfo: Record<string, PageInfo> = {}
	const translations = createBaseTranslationObject<TranslationMap>([
		defaultLangCode,
		...supportedLangCodes,
	])
	const routeTranslations =
		createBaseTranslationObject<RouteTranslationMap>(supportedLangCodes)

	const ignoredLangDirPatterns = getIgnoredLangDirectoryPatterns(
		pagesDirectory,
		astroI18nConfig,
	)

	forEachDirectory(
		pagesDirectory,
		(itemNames, path) => {
			for (const itemName of itemNames) {
				const fullPath = join(path, itemName)
				const relativePath = fullPath.replace(pagesDirectory, "")
				const route = isDirectory(fullPath)
					? pageI18nDirectoryPathToRoute(relativePath)
					: pagePathToRoute(relativePath)
				if (!route) continue
				const name = getPageName(relativePath)
				if (!routePageInfo[route]) {
					routePageInfo[route] = {
						name,
						route,
						path: "",
						hasGetStaticPaths: false,
					}
				}

				if (fullPath.endsWith(COMPONENT_EXTENSION)) {
					// page component
					routePageInfo[route].path = relativePath
					routePageInfo[route].hasGetStaticPaths =
						hasGetStaticPaths(fullPath)
					routePageInfo[route].name = name
				} else {
					// translation directory
					const { pageTranslations, pageRouteTranslations } =
						getI18nPageTranslations(
							fullPath,
							route,
							name,
							astroI18nConfig,
						)
					merge(translations, pageTranslations)
					merge(routeTranslations, pageRouteTranslations)
					/*
						[post]
						blog
						integrations
						showcase
						index
					*/
				}
			}
		},
		ignoredLangDirPatterns,
	)

	return {
		directory: pagesDirectory,
		// filter routes that have been created only for page translations :
		pages: Object.values(routePageInfo).filter((page) => !!page.path),
		translations,
		routeTranslations,
	}
}

/**
 * Buils a `LoadedTranslationMap` from a directory of translations.
 */
function getI18nPageTranslations(
	directoryPath: string,
	pageRoute: string,
	pageName: string,
	{ defaultLangCode, supportedLangCodes }: AstroI18nConfig,
) {
	const pageTranslations: TranslationMap = {}
	const pageRouteTranslations: RouteTranslationMap = {}
	const langCodes = new Set([defaultLangCode, ...supportedLangCodes])

	for (const itemName of readdirSync(directoryPath)) {
		const [langCode, extension] = splitFileName(itemName)
		if (extension !== "json") continue
		if (!langCodes.has(langCode)) continue
		const translation = importJson(join(directoryPath, itemName))
		if (typeof translation === "string") continue // no unloaded translations
		if (!isTranslation(translation)) continue

		// extracting route translation
		if (translation[ROUTE_TRANSLATION_KEY] !== undefined) {
			if (typeof translation[ROUTE_TRANSLATION_KEY] === "string") {
				addNestedProperty(
					pageRouteTranslations,
					[langCode, pageName],
					translation[ROUTE_TRANSLATION_KEY],
				)
			}
			delete translation[ROUTE_TRANSLATION_KEY]
		}

		// nesting the translations inside its page route
		let nestedTranslation = translation
		const segments = ["index", ...pageRoute.split("/").filter((s) => !!s)]
		for (let i = segments.length - 1; i > -1; i -= 1) {
			nestedTranslation = {
				[segments[i]]: nestedTranslation,
			}
		}

		// adding translation
		pageTranslations[langCode] = nestedTranslation
	}

	return { pageTranslations, pageRouteTranslations }
}

/**
 * @returns the corresponding route to the page or undefined if invalid.
 */
function pagePathToRoute(relativePath: string) {
	const route = relativePath.split(sep)
	const lastSegment = route.at(-1) ?? ""

	const index = lastSegment.lastIndexOf(".")
	if (index < 0) return undefined

	const [page, extension] = splitAt(lastSegment, index)
	if (extension !== COMPONENT_EXTENSION) return undefined

	if (page === "index") {
		route.pop()
	} else {
		route[route.length - 1] = page
	}

	return route.join("/") || "/" // empty string is home
}

/**
 * @returns The name of the page (last path segment), compensates for special
 * cases like `"index.astro"`.
 */
function getPageName(path: string) {
	const segments = path.split(sep)
	if (
		segments.at(-1) === `index${COMPONENT_EXTENSION}` ||
		segments.at(-1) === PAGE_TRANSLATION_DIRECTORY
	) {
		return segments.at(-2) || "index"
	}
	return getFileName(segments.at(-1) || "unknown")
}

/**
 * @returns the corresponding route to the i18n directory or undefined if
 * invalid.
 */
function pageI18nDirectoryPathToRoute(relativePath: string) {
	const route = relativePath.split(sep)
	let lastSegment = route.at(-1) ?? ""
	if (lastSegment === PAGE_TRANSLATION_DIRECTORY) {
		lastSegment = `index.${PAGE_TRANSLATION_DIRECTORY}`
	}

	const index = lastSegment.lastIndexOf(".")
	if (index < 0) return undefined

	const [page, i18n] = splitAt(lastSegment, index, true)
	if (i18n !== PAGE_TRANSLATION_DIRECTORY) return undefined
	if (page === "index") {
		route.pop()
	} else {
		route[route.length - 1] = page
	}

	return route.join("/") || "/" // empty string is home
}

/**
 * Checks if the file in `path` contains a `getStaticPaths` function.
 */
function hasGetStaticPaths(path: string) {
	try {
		const file = readFileSync(path, "utf8")
		return [
			"export function getStaticPaths",
			"export async function getStaticPaths",
			"export const getStaticPaths",
			"export { getStaticPaths }",
			"export {getStaticPaths}",
		].some((searchString) => file.includes(searchString))
	} catch (error) {
		return false
	}
}

/**
 * @returns An array of `RegExp` that should be ignored according to
 * `showDefaultLangCode`.
 */
function getIgnoredLangDirectoryPatterns(
	pagesDirectory: string,
	{
		showDefaultLangCode,
		defaultLangCode,
		supportedLangCodes,
	}: AstroI18nConfig,
) {
	let ignoredPathPatterns: RegExp[]

	if (showDefaultLangCode) {
		ignoredPathPatterns = [
			regexPathNotStartsWith(defaultLangCode, pagesDirectory),
		]
	} else {
		const langCodes = [...supportedLangCodes, defaultLangCode]
		ignoredPathPatterns = langCodes.map((code) =>
			regexPathStartsWith(code, pagesDirectory),
		)
	}

	return ignoredPathPatterns
}

/**
 * @returns A `RegExp` that is only valid when the path doesn't start with
 * `join(string, base)`.
 * See implementation for more details.
 */
function regexPathNotStartsWith(string: string, base = "") {
	let prefix = base
	if (prefix.at(-1) !== sep) prefix = `${prefix}${sep}`
	return new RegExp(`${prefix}(?!(${string}$)|(${string}${sep}(.+)?))`)
}

/**
 * @returns A `RegExp` that is only valid when the path starts with
 * `join(string, base)`.
 * See implementation for more details.
 */
function regexPathStartsWith(string: string, base = "") {
	let prefix = base
	if (prefix.at(-1) !== sep) prefix = `${prefix}${sep}`
	return new RegExp(`${prefix}(?=(${string}$)|(${string}${sep}(.+)?))`)
}

/**
 * @returns An object with all the `langCodes` items as keys.
 */
function createBaseTranslationObject<
	T extends TranslationMap | RouteTranslationMap,
>(langCodes: string[]) {
	const trans = {} as T
	for (const langCode of langCodes) {
		trans[langCode] = {}
	}
	return trans
}

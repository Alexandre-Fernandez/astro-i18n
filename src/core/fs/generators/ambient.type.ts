import { join } from "node:path"
import { tsTypeof } from "$lib/typescript-helpers"
import { removeFromEnd, removeFromStart } from "$lib/string"
import { isFile, writeNestedFile } from "$lib/filesystem"
import { merge } from "$lib/object-literal"
import { forEachTranslation } from "$src/core/translation"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import { removeRouteLangCode } from "$src/core/routing/lang.code"
import { getGeneratedDtsRootRelativePath, getPagesMetadata } from "$src/core/fs"
import { PACKAGE_NAME } from "$src/constants"
import type { AstroI18nConfig, TranslationMap } from "$src/types/config"
import type { PagesMetadata } from "$src/types/app"

// LANG CODE
const DEFAULT_LANG_CODE = "DefaultLangCode"
const SUPPORTED_LANG_CODE = "SupportedLangCode"
const LANG_CODE = "LangCode"
// ROUTE
const L_FUNCTION = "l"
const ROUTE_URI = "RouteUri"
const ROUTE_PARAMS = "RouteParams"
// TRANSLATION
const T_FUNCTION = "t"
const TRANSLATION_PATH = "TranslationPath"
const TRANSLATION_OPTIONS = "TranslationOptions"
// ASTRO I18N CLASS
const ASTRO_I18N = "AstroI18n"
const TRANSLATION = "Translation"
const TRANSLATIONS = "Translations"
const ROUTE_TRANSLATIONS = "RouteTranslations"
const INTERPOLATION_FORMATTER = "InterpolationFormatter"

const DEFAULT_MODULE_DECLARATION = `declare module "${PACKAGE_NAME}" {\n\texport * from "${PACKAGE_NAME}/"\n}`
const OVERRIDE_MODULE_DECLARATION = `declare module "${PACKAGE_NAME}" {\n\texport * from "${PACKAGE_NAME}/"\n\t\n\texport function ${L_FUNCTION}<Uri extends ${ROUTE_URI}>(\n\t\troute: Uri | string & {},\n\t\t...args: undefined extends ${ROUTE_PARAMS}[Uri]\n\t\t\t? [params?: ${ROUTE_PARAMS}[Uri], targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]\n\t\t\t: [params: ${ROUTE_PARAMS}[Uri], targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]\n\t): string\n\t\n\texport function ${T_FUNCTION}<Path extends ${TRANSLATION_PATH}>(\n\t\tpath: Path | string & {},\n\t\t...args: undefined extends ${TRANSLATION_OPTIONS}[Path]\n\t\t\t? [options?: ${TRANSLATION_OPTIONS}[Path], langCode?: ${LANG_CODE}]\n\t\t\t: [options: ${TRANSLATION_OPTIONS}[Path], langCode?: ${LANG_CODE}]\n\t): string\n\t\n\texport function extractRouteLangCode(route: string): ${LANG_CODE} | undefined\n\t\n\ttype ${TRANSLATION} = string | { [translationKey: string]: string | ${TRANSLATION} }\n\ttype ${TRANSLATIONS} = { [langCode: string]: Record<string, ${TRANSLATION}> }\n\ttype ${ROUTE_TRANSLATIONS} = { [langCode: string]: Record<string, string> }\n\ttype ${INTERPOLATION_FORMATTER} = (value: unknown, ...args: unknown[]) => string\n\tclass ${ASTRO_I18N} {\n\t\tdefaultLangCode: ${DEFAULT_LANG_CODE}\n\t\tsupportedLangCodes: ${SUPPORTED_LANG_CODE}[]\n\t\tshowDefaultLangCode: boolean\n\t\ttranslations: ${TRANSLATIONS}\n\t\trouteTranslations: ${ROUTE_TRANSLATIONS}\n\t\tget langCodes(): ${LANG_CODE}[]\n\t\tget langCode(): ${LANG_CODE}\n\t\tset langCode(langCode: ${LANG_CODE})\n\t\tget formatters(): Record<string, ${INTERPOLATION_FORMATTER}>\n\t\tinit(Astro: { url: URL }, formatters?: Record<string, ${INTERPOLATION_FORMATTER}>): void\n\t\tgetFormatter(name: string): ${INTERPOLATION_FORMATTER} | undefined\n\t\tsetFormatter(name: string, formatter: ${INTERPOLATION_FORMATTER}): void\n\t\tdeleteFormatter(name: string): void\n\t}\n\texport const astroI18n: AstroI18n\n}`

export async function generateAmbientType(
	root: string,
	preloaded?: {
		astroI18nConfig: AstroI18nConfig
		pagesMetadata: PagesMetadata
		routes: string[]
	},
	pathToConfig = "",
) {
	const astroI18nConfig =
		preloaded?.astroI18nConfig ||
		(await loadAstroI18nConfig(root, pathToConfig))
	const pagesMetadata =
		preloaded?.pagesMetadata || getPagesMetadata(root, astroI18nConfig)
	merge(astroI18nConfig.translations, pagesMetadata.translations)

	writeNestedFile(
		join(root, getGeneratedDtsRootRelativePath()),
		getAmbientType(
			astroI18nConfig,
			preloaded?.routes ||
				pagesMetadata.pages.map((p) =>
					removeRouteLangCode(p.route, astroI18nConfig),
				),
		),
	)
}

export function generateDefaultAmbientType(root: string, override = false) {
	const path = join(root, getGeneratedDtsRootRelativePath())
	if (override) {
		writeNestedFile(path, `${DEFAULT_MODULE_DECLARATION}\n`)
		return
	}
	if (isFile(path)) return
	writeNestedFile(path, `${DEFAULT_MODULE_DECLARATION}\n`)
}

export function getAmbientType(
	astroI18nConfig: AstroI18nConfig,
	uniqueRoutes: string[],
) {
	return `${getLangCodeTypes(astroI18nConfig)}\n${getRouteTypes(
		uniqueRoutes,
	)}\n${getTranslationTypes(
		astroI18nConfig.translations,
	)}\n\n${OVERRIDE_MODULE_DECLARATION}\n`
}

// LANG CODE

function getLangCodeTypes({
	defaultLangCode,
	supportedLangCodes,
}: AstroI18nConfig) {
	let langCodeTypes = defaultLangCode
		? `type ${DEFAULT_LANG_CODE} = "${defaultLangCode}"\n`
		: `type ${DEFAULT_LANG_CODE} = string\n`

	langCodeTypes +=
		supportedLangCodes.length > 0
			? `type ${SUPPORTED_LANG_CODE} = "${supportedLangCodes.join(
					'" | "',
			  )}"\n`
			: `type ${SUPPORTED_LANG_CODE} = string\n`

	const langCodes = [defaultLangCode, ...supportedLangCodes].filter(
		(langCode) => !!langCode,
	)
	return langCodes.length > 0
		? `${langCodeTypes}type ${LANG_CODE} = ${DEFAULT_LANG_CODE} | ${SUPPORTED_LANG_CODE}`
		: `${langCodeTypes}type ${LANG_CODE} = string`
}

// ROUTES

function getRouteTypes(routes: string[]) {
	let routeUri = `type ${ROUTE_URI} = `
	let routeParams = `type ${ROUTE_PARAMS} = {`
	if (routes.length === 0) {
		routeUri += "string"
		routeParams += "{ [uri: string]: undefined }"
	} else {
		for (const route of routes) {
			routeUri += `| "${route}" `
			const params = extractRouteParamNames(route)
			routeParams += `"${route}": ${routeParamsRecord(params)}; `
		}
		routeParams += "}"
	}

	return `${routeUri}\n${routeParams}`
}

function extractRouteParamNames(route: string) {
	const routeParamNames: string[] = []
	for (const [match] of route.matchAll(/\/\[.+?](\/)?/g)) {
		let param = removeFromStart(match, "/[")
		if (!param.endsWith("/")) param += "/"
		routeParamNames.push(removeFromEnd(param, "]/"))
	}
	return routeParamNames
}

function routeParamsRecord(params: string[] = []) {
	if (params.length === 0) return "undefined"
	return `{ ${params.reduce(
		(acc, param) => `${acc}"${param}": string; `,
		"",
	)}}`
}

// TRANSLATIONS

// FIX LINT
// eslint-disable-next-line sonarjs/cognitive-complexity
function getTranslationTypes(translations: TranslationMap) {
	const paths = new Set<string>()
	const options: {
		[path: string]: {
			properties: {
				[property: string]:
					| {
							type: string
							source: "variant" | "argument"
					  }
					| {
							type: string
							source: "interpolation"
							isOptional: boolean
					  }
			}
			hasDefaultVariant?: true
		}
	} = {}

	forEachTranslation(translations, (path, { variant }, interpolations) => {
		paths.add(`"${path}"`)
		if (!options[path]) options[path] = { properties: {} }

		for (const {
			name,
			default: defaultValue,
			formatters,
		} of interpolations) {
			// interpolation variable
			options[path].properties[name] = {
				type: formatters.length > 0 ? "unknown" : "string",
				source: "interpolation",
				isOptional: !!defaultValue,
			}
			// interpolation formatter arguments
			for (const { arguments: args } of formatters) {
				for (const arg of args) {
					if (!arg.name) continue
					options[path].properties[arg.name] = {
						type: "unknown",
						source: "argument",
					}
				}
			}
		}

		if (variant.properties.length === 0) {
			options[path].hasDefaultVariant = true
			return
		}
		for (const { name, value } of variant.properties) {
			options[path].properties[name] = {
				type: tsTypeof(value),
				source: "variant",
			}
		}
	})

	let translationPath = `type ${TRANSLATION_PATH} = `
	let translationOptions = `type ${TRANSLATION_OPTIONS} = `

	const optionEntries = Object.entries(options)

	if (paths.size === 0 || optionEntries.length === 0) {
		translationPath += "string"
		translationOptions +=
			"{ [path: string]: undefined | Record<string, string | number | unknown> }"
		return `${translationPath}\n${translationOptions}`
	}

	translationPath += [...paths].join(" | ")
	translationOptions += "{ "
	for (const [path, { properties, hasDefaultVariant }] of optionEntries) {
		const propertiesEntries = Object.entries(properties)
		if (propertiesEntries.length === 0) {
			translationOptions += `"${path}": {} | undefined; `
			continue
		}

		let pathOptions = "{ "
		let optionalProperties = 0
		for (const [name, data] of propertiesEntries) {
			if (
				(data.source === "interpolation" && data.isOptional) ||
				(data.source === "variant" && hasDefaultVariant)
			) {
				pathOptions += `${name}?: ${data.type}; `
				optionalProperties += 1
				continue
			}
			pathOptions += `${name}: ${data.type}; `
		}
		pathOptions +=
			optionalProperties === propertiesEntries.length
				? "} | undefined"
				: "}"

		translationOptions += `"${path}": ${pathOptions}; `
	}
	translationOptions += "}"

	return `${translationPath}\n${translationOptions}`
}

import {
	glue,
	removeFromEnd,
	removeFromStart,
	splitAfter,
	trimString,
} from "$lib/string"
import { COMPONENT_EXTENSION } from "$src/constants"
import astroI18n from "$src/core/state"
import type { FullRouteTranslationMap } from "$src/types/app"
import type { AstroI18nConfig } from "$src/types/config"

export function l(
	route: string,
	params?: Record<string, string>,
	targetLangCode = astroI18n.langCode,
	routeLangCode = "",
) {
	const { langCodes, defaultLangCode, showDefaultLangCode } = astroI18n
	const { fullRouteTranslations } = astroI18n.internals()

	const segments = trimString(route, "/").split("/")

	// removing langCode
	if (langCodes.includes(segments[0])) {
		segments.shift()
	}

	// translating route
	const inputLangCode =
		routeLangCode ||
		detectRouteLangCode(segments, fullRouteTranslations) ||
		defaultLangCode

	let translatedRoute = segments
		.map((segment) =>
			fullRouteTranslations[inputLangCode]?.[segment]?.[targetLangCode]
				? fullRouteTranslations[inputLangCode][segment][targetLangCode]
				: segment,
		)
		.join("/")

	// replacing params
	if (params) {
		for (const [param, value] of Object.entries(params)) {
			translatedRoute = translatedRoute.replace(`[${param}]`, value)
		}
	}

	// adding langCode back if needed
	if (showDefaultLangCode || targetLangCode !== defaultLangCode) {
		return `/${targetLangCode}/${translatedRoute}`
	}
	return `/${translatedRoute}`
}

export function appendQueryString(url: string, query: Record<string, string>) {
	const searchParams = new URLSearchParams(query).toString()
	return searchParams ? `${url}?${searchParams}` : url
}

/**
 * Internal function for `l`, can be used with routes or paths.
 */
export function translatePath(
	route: string,
	langCode: string,
	{
		defaultLangCode,
		supportedLangCodes,
		showDefaultLangCode,
		routeTranslations,
	}: AstroI18nConfig,
	separator = "/",
	base = "",
) {
	const [prefix, suffix] = splitAfter(route.toLowerCase(), base.toLowerCase())
	if (!suffix) return route || separator

	// removing leading slash and splitting suffix
	const segments = removeFromStart(suffix, separator).split(separator)

	// removing langCode
	if ([defaultLangCode, ...supportedLangCodes].includes(segments[0])) {
		segments.shift()
	}

	const lastSegment = segments.at(-1) || ""

	let addExtensionBack = false
	if (
		lastSegment.endsWith(COMPONENT_EXTENSION) &&
		lastSegment !== `index${COMPONENT_EXTENSION}`
	) {
		// remove COMPONENT_EXTENSION from lastSegment so the routeTranslations can map it
		segments[segments.length - 1] = lastSegment.replace(
			COMPONENT_EXTENSION,
			"",
		)
		addExtensionBack = true
	}

	// adding back langCode, if needed
	if (showDefaultLangCode || langCode !== defaultLangCode) {
		segments.unshift(langCode)
	}

	const translatedPath = glue(
		prefix,
		separator,
		segments
			.map((segment) =>
				routeTranslations[langCode]?.[segment]
					? routeTranslations[langCode][segment]
					: segment,
			)
			.join(separator),
	)

	if (addExtensionBack) {
		return (
			removeFromEnd(
				`${translatedPath}${COMPONENT_EXTENSION}`,
				separator,
			) || separator
		)
	}
	return removeFromEnd(translatedPath, separator) || separator
}

function detectRouteLangCode(
	routeSegments: string[],
	fullRouteTranslations: FullRouteTranslationMap,
) {
	const langCodeScores: Record<string, number> = {}

	for (const segment of routeSegments) {
		// adding 1 point if a segment is in translations
		for (const [langCode, translations] of Object.entries(
			fullRouteTranslations,
		)) {
			if (!langCodeScores[langCode]) langCodeScores[langCode] = 0

			if (translations[segment]) {
				langCodeScores[langCode] += 1
			}
		}
	}

	// removing duplicate scores
	const uniqueLangCodeScores = Object.entries(langCodeScores)
		.filter(
			([langCode, score], _, entries) =>
				entries.findIndex(
					([lng, scr]) => lng !== langCode && scr === score,
				) === -1,
		)
		.sort((a, b) => b[1] - a[1])

	return uniqueLangCodeScores.at(0)?.[0]
}

/**
 * Removes the lang code from a route.
 * **WARNING** the route needs to start with the lang code: `"en"` or
 * `"/en"`.
 */
export function removeRouteLangCode(
	route: string,
	{ defaultLangCode, supportedLangCodes }: AstroI18nConfig,
) {
	if (route.startsWith("/")) {
		for (const langCode of [defaultLangCode, ...supportedLangCodes]) {
			const regex = new RegExp(`^/${langCode}(/)?`)
			if (regex.test(route)) {
				return route.replace(regex, "/")
			}
		}
	} else {
		for (const langCode of [defaultLangCode, ...supportedLangCodes]) {
			const regex = new RegExp(`^${langCode}(/)?`)
			if (regex.test(route)) {
				return route.replace(regex, "")
			}
		}
	}
	return route
}

export function extractRouteLangCode(
	route: string,
	langCodes = astroI18n.langCodes,
	fallbackLangCode = astroI18n.defaultLangCode,
) {
	return (
		route.match(new RegExp(`^/?(${langCodes.join("|")})(?:/.+)?$`))?.[1] ||
		fallbackLangCode
	)
}

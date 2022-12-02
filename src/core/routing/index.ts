import { glue, removeFromEnd, removeFromStart, splitAfter } from "$lib/string"
import { COMPONENT_EXTENSION } from "$src/constants"
import astroI18n from "$src/core/state"
import type { RouteParams, RouteUri } from "$src/types/app"
import type { AstroI18nConfig } from "$src/types/config"

export function l<Uri extends RouteUri>(
	route: Uri,
	params?: RouteParams[Uri],
	query: Record<string, string> = {},
	langCode = astroI18n.langCode,
) {
	let translatedRoute = translatePath(route, langCode, astroI18n)
	if (!params) return getQueriedRoute(translatedRoute, query)
	for (const [param, value] of Object.entries(params)) {
		translatedRoute = translatedRoute.replace(`[${param}]`, value)
	}
	return getQueriedRoute(translatedRoute, query)
}

function getQueriedRoute(route: string, query: Record<string, string>) {
	const queryString = new URLSearchParams(query).toString()
	return queryString ? `${route}?${queryString}` : route
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

import type { AstroI18nConfig } from "$src/types/config"
// separated file to avoid dependency cycle between "src/core/routing" and "src/core/state"

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

export function extractRouteLangCode(route: string, langCodes: string[]) {
	return route.match(new RegExp(`/?(${langCodes.join("|")})(?:/.*)?$`))?.[1]
}

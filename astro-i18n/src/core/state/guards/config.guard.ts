import { isObject, isStringArray } from "@lib/ts/guards"
import { isConfigRoutes } from "@src/core/state/guards/config-routes.guard"
import { isConfigTranslations } from "@src/core/state/guards/config-translations.guard"
import type { AstroI18nConfig } from "@src/core/state/types"

export function isPartialConfig(
	config: unknown,
): config is Partial<AstroI18nConfig> {
	if (!isObject(config)) return false

	for (const [key, value] of Object.entries(config)) {
		switch (key) {
			case "primaryLocale": {
				if (typeof value !== "string") return false
				break
			}
			case "secondaryLocales": {
				if (!isStringArray(value)) return false
				break
			}
			case "showPrimaryLocale": {
				if (typeof value !== "boolean") return false
				break
			}
			case "trailingSlash": {
				if (value !== "always" && value !== "never") return false
				break
			}
			case "run": {
				if (value !== "server" && value !== "client+server") {
					return false
				}
				break
			}
			case "translations": {
				if (!isConfigTranslations(value)) return false
				break
			}
			case "routes": {
				if (!isConfigRoutes(value)) return false
				break
			}
			default: {
				return false
			}
		}
	}

	return true
}

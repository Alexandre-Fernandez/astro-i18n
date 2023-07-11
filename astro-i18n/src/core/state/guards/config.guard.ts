import type { AstroI18nConfig } from "@src/core/state/types"

export function isConfig(config: unknown): config is AstroI18nConfig {
	if (!config || typeof config !== "object") return false

	for (const [key, value] of Object.entries(config)) {
		switch (key) {
			case "primaryLocale": {
				if (typeof value !== "string") return false
				break
			}
			case "secondaryLocales": {
				if (!Array.isArray(value)) return false
				if (!value.every((item) => typeof item === "string")) {
					return false
				}
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
				return false
			}
			case "routes": {
				return false
			}
			default: {
				return false
			}
		}
	}

	return false
}
/*
	export type ConfigTranslations = {
		[namespace: string]: {
			[locale: string]: DeepStringRecord
		}
	} & {
		$load?: {
			namespaces: string[]
			routes: string[]
		}[]
	}
*/
function isConfigTranslations(translations: unknown) {
	//
}

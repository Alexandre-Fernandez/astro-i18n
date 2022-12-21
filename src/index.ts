import configSetup from "$src/hooks/config.setup"
import astroI18n from "$src/core/state"
import { extractRouteLangCode as internalExtractRouteLangCode } from "$src/core/routing/lang.code"
import type { AstroIntegration } from "astro"

/**
 * @param astroI18nConfigFile The path to `astro.i18n.config` relative to the
 * root directory, or the `astro.i18n.config` object.
 */
export default function i18n(astroI18nConfigFile = ""): AstroIntegration {
	return {
		name: "astro-i18n",
		hooks: {
			"astro:config:setup": (options) =>
				configSetup(options, astroI18nConfigFile),
		},
	}
}

export function extractRouteLangCode(route: string) {
	internalExtractRouteLangCode(route, astroI18n.langCodes)
}

export { defineAstroI18nConfig } from "$src/core/fs/config"

export { default as astroI18n } from "$src/core/state"

export { l, appendQueryString } from "$src/core/routing"

export { t } from "$src/core/translation"

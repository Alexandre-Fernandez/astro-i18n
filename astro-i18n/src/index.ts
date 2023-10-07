import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { AstroI18nConfig } from "@src/core/config/types"
/*



###> astro-i18n/exports ### */
export function defineAstroI18nConfig(config: Partial<AstroI18nConfig>) {
	return config
}

export { useAstroI18n } from "@src/core/astro/middleware"

export { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"

export { createGetStaticPaths } from "@src/core/page/functions/frontmatter.functions"

export const t = astroI18n.t.bind(astroI18n)

export const l = astroI18n.l.bind(astroI18n)
/* ###< astro-i18n/exports ###



###> astro-i18n/types ### */
export type {
	AstroI18nConfig,
	ConfigTranslations as Translations,
	ConfigTranslationLoadingRules as TranslationLoadingRules,
	ConfigRoutes as SegmentTranslations,
} from "@src/core/config/types"

export type { Formatters as TranslationFormatters } from "@src/core/translation/types"
/* ###< astro-i18n/types ### */

import { fileURLToPath } from "node:url"
import { merge } from "$lib/object-literal"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import { getPagesMetadata } from "$src/core/fs"
import { getTranslationVariants } from "$src/core/translation"
import type { AstroHooks } from "$src/types/astro"
import { createFullRouteTranslations } from "$src/core/routing"

export default async function configSetup(
	{
		config: astroConfig,
		injectScript,
	}: Parameters<AstroHooks["config:setup"]>[0],
	customPathToConfig = "",
) {
	const rootPath = fileURLToPath(astroConfig.root)

	const astroI18nConfig = await loadAstroI18nConfig(
		rootPath,
		customPathToConfig,
	)
	const pagesMetadata = getPagesMetadata(rootPath, astroI18nConfig)
	merge(astroI18nConfig.routeTranslations, pagesMetadata.routeTranslations)
	merge(astroI18nConfig.translations, pagesMetadata.translations)

	if (
		!astroI18nConfig.trailingSlash &&
		astroConfig.trailingSlash !== "ignore"
	) {
		astroI18nConfig.trailingSlash = astroConfig.trailingSlash
	}

	const stringifiedConfig = JSON.stringify(astroI18nConfig)
	const stringifiedVariants = JSON.stringify(
		getTranslationVariants(astroI18nConfig.translations),
	)
	const stringifiedFullRouteTranslations = JSON.stringify(
		createFullRouteTranslations(astroI18nConfig),
	)

	injectScript(
		"page-ssr",
		[
			'import { astroI18n } from "astro-i18n"',
			`astroI18n.internals().init(${stringifiedConfig}, ${stringifiedVariants}, ${stringifiedFullRouteTranslations})`,
		].join(";"),
	)
}

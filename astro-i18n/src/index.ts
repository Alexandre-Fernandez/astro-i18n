import "@src/core/state/singletons/astro-i18n.singleton" // init astro-i18n.singleton
import type { AstroIntegration } from "astro"
import type { AstroI18nConfig } from "@src/core/config/types"

export { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"

export default function i18n(): AstroIntegration {
	return {
		name: "astro-i18n",
		hooks: {
			"astro:server:setup": ({ server }) => {
				server.middlewares.use((_req, _res, next) => {
					return next()
				})
			},
		},
	}
}

export { useAstroI18n } from "@src/core/astro/middleware"

export function defineAstroI18nConfig(config: Partial<AstroI18nConfig>) {
	return config
}

// async function configSetup(
// 	{
// 		config: astroConfig,
// 		injectScript,
// 	}: Parameters<AstroHooks["config:setup"]>[0],
// 	customPathToConfig = "",
// ) {}

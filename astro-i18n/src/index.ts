import "@src/core/state/singletons/astro-i18n.singleton" // init astro-i18n.singleton
import { singleton } from "@src/core/astro/middleware"
import type { AstroIntegration } from "astro"

export { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"

export default function i18n(): AstroIntegration {
	return {
		name: "astro-i18n",
		hooks: {
			"astro:server:setup": ({ server }) => {
				server.middlewares.use((req, res, next) => {
					return next()
				})
			},
		},
	}
}
export { useAstroI18n } from "@src/core/astro/middleware"

export function getSingleton() {
	return singleton.value
}

export function setSingleton() {
	singleton.value += 1
}

// async function configSetup(
// 	{
// 		config: astroConfig,
// 		injectScript,
// 	}: Parameters<AstroHooks["config:setup"]>[0],
// 	customPathToConfig = "",
// ) {}

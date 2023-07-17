import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	importJson,
	importScript,
} from "@lib/async-node/functions/import.functions"
import { popPath, toPosixPath } from "@lib/async-node/functions/path.functions"
import { assert } from "@lib/ts/guards"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import ConfigNotFound from "@src/core/state/errors/config-not-found.error"
import RootNotFound from "@src/core/state/errors/root-not-found.error"
import {
	autofindAstroI18nConfig,
	autofindProjectRoot,
	hasAstroConfig,
} from "@src/core/state/functions/config.functions"
import { isPartialConfig } from "@src/core/state/guards/config.guard"
import type {
	AstroI18nConfig,
	ConfigRoutes,
	ConfigTranslations,
} from "@src/core/state/types"

class Config implements AstroI18nConfig {
	primaryLocale = "en"

	secondaryLocales: string[] = []

	showPrimaryLocale = false

	trailingSlash: "always" | "never" = "never"

	run: "server" | "client+server" = "client+server"

	translations: ConfigTranslations = {}

	routes: ConfigRoutes = {}

	constructor({
		primaryLocale,
		secondaryLocales,
		showPrimaryLocale,
		trailingSlash,
		run,
		translations,
		routes,
	}: Partial<AstroI18nConfig> = {}) {
		if (primaryLocale) this.primaryLocale = primaryLocale
		if (secondaryLocales) this.secondaryLocales = secondaryLocales
		if (showPrimaryLocale) this.showPrimaryLocale = showPrimaryLocale
		if (trailingSlash) this.trailingSlash = trailingSlash
		if (run) this.run = run
		if (translations) this.translations = translations
		if (routes) this.routes = routes
	}

	static async fromFilesystem(path: string | null = null) {
		const { fileURLToPath } = await AsyncNode.url

		// find from PWD
		if (!path) {
			path = await autofindAstroI18nConfig(
				await toPosixPath(process.env["PWD"] || ""),
			)
		}

		// find from import.meta.url
		if (!path) {
			path = await autofindAstroI18nConfig(
				await toPosixPath(fileURLToPath(import.meta.url)),
			)
		}

		if (!path) throw new ConfigNotFound()

		const config = path.endsWith(".json")
			? await importJson(path)
			: (await importScript(path))["default"]

		assert(config, isPartialConfig, "AstroI18nConfig")

		let root = await popPath(path)

		if (!(await hasAstroConfig(root))) {
			const found = await autofindProjectRoot(path)
			if (!found) throw new RootNotFound()
			root = found
		}

		console.log(await getProjectPages(root, config))

		return {} || new Config(config)
	}
}

export default Config

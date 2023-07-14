import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	importJson,
	importScript,
} from "@lib/async-node/functions/import.functions"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { assert } from "@lib/ts/guards"
import ConfigNotFound from "@src/core/state/errors/config-not-found.error"
import { autofindConfig } from "@src/core/state/functions/config.functions"
import { isPartialConfig } from "@src/core/state/guards/config.guard"
import type { AstroI18nConfig } from "@src/core/state/types"

class Config implements AstroI18nConfig {
	primaryLocale = "en"

	secondaryLocales = [] as AstroI18nConfig["secondaryLocales"]

	showPrimaryLocale = false

	trailingSlash = "never" as AstroI18nConfig["trailingSlash"]

	run = "client+server" as AstroI18nConfig["run"]

	translations = {} as AstroI18nConfig["translations"]

	routes = {} as AstroI18nConfig["routes"]

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

	static async fromFilesystem() {
		const { fileURLToPath } = await AsyncNode.url

		// find from PWD
		let path = await autofindConfig(
			await toPosixPath(process.env["PWD"] || ""),
		)

		// find from import.meta.url
		if (!path) {
			path = await autofindConfig(
				await toPosixPath(fileURLToPath(import.meta.url)),
			)
		}

		if (!path) throw new ConfigNotFound()

		const config = path.endsWith(".json")
			? await importJson(path)
			: (await importScript(path))["default"]

		assert(config, isPartialConfig, "AstroI18nConfig")

		return new Config(config)
	}
}

export default Config

import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { autofindConfig } from "@src/core/state/functions/config.functions"
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
	}: Partial<AstroI18nConfig>) {
		if (primaryLocale) this.primaryLocale = primaryLocale
		if (secondaryLocales) this.secondaryLocales = secondaryLocales
		if (showPrimaryLocale) this.showPrimaryLocale = showPrimaryLocale
		if (trailingSlash) this.trailingSlash = trailingSlash
		if (run) this.run = run
		if (translations) this.translations = translations
		if (routes) this.routes = routes
	}

	static async fromFilesystem() {
		const [{ fileURLToPath }, { readdirSync }] = await Promise.all([
			AsyncNode.url,
			AsyncNode.fs,
			AsyncNode.posix,
		])

		// find from PWD
		let config = await autofindConfig(
			await toPosixPath(process.env["PWD"] || ""),
		)

		// find from import.meta.url
		if (!config) {
			config = await autofindConfig(
				await toPosixPath(fileURLToPath(import.meta.url)),
			)
		}

		//

		console.log(config)
		// parse config

		return config
	}
}

export default Config

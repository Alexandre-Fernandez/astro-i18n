import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { throwError } from "@lib/error"
import UnreachableCode from "@src/errors/unreachable-code.error"
import { ASTRO_I18N_CONFIG_PATTERN } from "@src/constants/patterns.constants"
import { autofindConfig } from "@src/core/state/functions/config.functions"
import ConfigNotFound from "@src/core/state/errors/config-not-found.error"
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

		const cwd = await toPosixPath(
			process.env["PWD"] || fileURLToPath(import.meta.url),
		)

		return autofindConfig(fileURLToPath(import.meta.url))

		const config = readdirSync(cwd).find((file) =>
			ASTRO_I18N_CONFIG_PATTERN.test(file),
		)

		let path = ""
		for (const file of readdirSync(cwd)) {
			const { match } = ASTRO_I18N_CONFIG_PATTERN.match(file) || {}
			if (!match) continue
			const name = match[0] || throwError(new UnreachableCode())
			path = `${cwd}/${name}`
			break
		}

		if (!path) {
			path =
				(await autofindConfig(cwd)) || throwError(new ConfigNotFound())
		}
	}
}

export default Config

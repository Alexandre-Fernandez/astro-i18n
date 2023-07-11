import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions"
import { throwError } from "@lib/error"
import UnreachableCode from "@src/errors/unreachable-code.error"
import { ASTRO_I18N_CONFIG_PATTERN } from "@src/constants/patterns.constants"
import type { AstroI18nConfig } from "@src/core/state/types"

class Config implements AstroI18nConfig {
	primaryLocale = "en"

	secondaryLocales = []

	showPrimaryLocale = false

	trailingSlash = "never" as const

	run = "client+server" as const

	translations = {}

	routes = {}

	constructor() {
		// load from object
	}

	static async loadFromFilesystem() {}

	static async findConfig() {
		const [{ fileURLToPath }, { readdirSync }] = await Promise.all([
			AsyncNode.url,
			AsyncNode.fs,
			AsyncNode.posix,
		])

		const cwd = await toPosixPath(
			process.env["PWD"] || fileURLToPath(import.meta.url),
		)

		const config = readdirSync(cwd).find((file) =>
			ASTRO_I18N_CONFIG_PATTERN.test(file),
		)

		let path = ""
		for (const file of readdirSync(cwd)) {
			const { match } = ASTRO_I18N_CONFIG_PATTERN.match(file) || {}
			if (!match) continue
			const name = match[0] || throwError(new UnreachableCode())
			const extension = match[1] || throwError(new UnreachableCode())

			path = `${cwd}/${name}` // return new Config()
		}

		console.log(path)
	}
}

export default Config

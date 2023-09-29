import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	importJson,
	importScript,
} from "@lib/async-node/functions/import.functions"
import { popPath, toPosixPath } from "@lib/async-node/functions/path.functions"
import { throwError, throwFalsy } from "@lib/error"
import { merge } from "@lib/object"
import { assert } from "@lib/ts/guards"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import ConfigNotFound from "@src/core/config/errors/config-not-found.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import {
	autofindAstroI18nConfig,
	autofindProjectRoot,
	getProjectTranslationGroups,
	hasAstroConfig,
} from "@src/core/config/functions/config.functions"
import { isPartialConfig } from "@src/core/config/guards/config.guard"
import type {
	AstroI18nConfig,
	ConfigTranslationLoadingRules,
	ConfigRoutes,
	ConfigTranslationDirectory,
	ConfigTranslations,
	SerializedConfig,
} from "@src/core/config/types"
import UnreachableCode from "@src/errors/unreachable-code.error"

class Config implements AstroI18nConfig {
	primaryLocale = "en"

	secondaryLocales: string[] = []

	showPrimaryLocale = false

	trailingSlash: "always" | "never" = "never"

	run: "server" | "client+server" = "client+server"

	translations: ConfigTranslations = {}

	translationLoadingRules: ConfigTranslationLoadingRules = []

	translationDirectory: ConfigTranslationDirectory = {}

	routes: ConfigRoutes = {}

	constructor({
		primaryLocale,
		secondaryLocales,
		showPrimaryLocale,
		trailingSlash,
		run,
		translations,
		translationLoadingRules,
		translationDirectory,
		routes,
	}: Partial<AstroI18nConfig> = {}) {
		if (primaryLocale) {
			this.primaryLocale = primaryLocale
		}
		if (secondaryLocales) {
			this.secondaryLocales = secondaryLocales
		}
		if (showPrimaryLocale) {
			this.showPrimaryLocale = showPrimaryLocale
		}
		if (trailingSlash) {
			this.trailingSlash = trailingSlash
		}
		if (run) {
			this.run = run
		}
		if (translations) {
			this.translations = translations
		}
		if (translationLoadingRules) {
			this.translationLoadingRules = translationLoadingRules
		}
		if (translationDirectory) {
			this.translationDirectory = translationDirectory
		}
		if (routes) {
			this.routes = routes
		}
	}

	get pages() {
		return Object.keys(this.translations).filter((group) =>
			group.startsWith("/"),
		)
	}

	static async fromFilesystem(path: string | null = null) {
		const { fileURLToPath } = await AsyncNode.url

		// find from PWD
		if (!path) {
			path = await autofindAstroI18nConfig(
				await toPosixPath(process.env["PWD"] || ""),
			)
		}

		// find from current module
		if (!path) {
			let filename = ""

			if (typeof import.meta.url === "string") {
				filename = fileURLToPath(import.meta.url)
			} else if (typeof __filename === "string") {
				filename = __filename
			}

			if (filename) {
				path = await autofindAstroI18nConfig(
					await toPosixPath(filename),
				)
			}
		}

		if (!path) throw new ConfigNotFound()

		const partialConfig = path.endsWith(".json")
			? await importJson(path)
			: (await importScript(path))["default"]

		assert(partialConfig, isPartialConfig, "AstroI18nConfig")

		const config = new Config(partialConfig)

		// find project root
		let root = await popPath(path)
		if (!(await hasAstroConfig(root))) {
			const found = await autofindProjectRoot(path)
			if (!found) throw new RootNotFound()
			root = found
		}

		const pages = await getProjectPages(root, config)
		// merging page translations & routes to the config
		for (const page of pages) {
			if (!config.translations[page.route]) {
				config.translations[page.route] = {}
			}
			merge(
				config.translations[page.route] ||
					throwError(new UnreachableCode()),
				page.translations,
			)
			if (!config.routes) config.routes = {}
			merge(config.routes, page.routes)
		}

		const groups = await getProjectTranslationGroups(root, config)
		// merging translation groups to the config
		merge(config.translations, groups)

		return config
	}

	toClientSideObject() {
		return {
			primaryLocale: this.primaryLocale,
			secondaryLocales: this.secondaryLocales,
			showPrimaryLocale: this.showPrimaryLocale,
			trailingSlash: this.trailingSlash,
		} as SerializedConfig
	}
}

export default Config

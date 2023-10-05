import { popPath, toPosixPath } from "@lib/async-node/functions/path.functions"
import { throwError } from "@lib/error"
import { merge } from "@lib/object"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import {
	autofindAstroI18nConfig,
	autofindProjectRoot,
	getProjectTranslationGroups,
	hasAstroConfig,
} from "@src/core/config/functions/config.functions"
import type {
	AstroI18nConfig,
	ConfigTranslationLoadingRules,
	ConfigRoutes,
	ConfigTranslationDirectory,
	ConfigTranslations,
	SerializedConfig,
} from "@src/core/config/types"
import UnreachableCode from "@src/errors/unreachable-code.error"
import AsyncNode from "@lib/async-node/classes/async-node.class"
import ConfigNotFound from "@src/core/config/errors/config-not-found.error"
import {
	importJson,
	importScript,
} from "@lib/async-node/functions/import.functions"
import { isPartialConfig } from "@src/core/config/guards/config.guard"
import { assert } from "@lib/ts/guards"

class Config implements AstroI18nConfig {
	primaryLocale

	secondaryLocales: string[]

	fallbackLocale

	showPrimaryLocale

	trailingSlash: "always" | "never"

	run: "server" | "client+server"

	translations: ConfigTranslations

	translationLoadingRules: ConfigTranslationLoadingRules

	translationDirectory: ConfigTranslationDirectory

	routes: ConfigRoutes

	path: string

	constructor(
		{
			primaryLocale,
			secondaryLocales,
			fallbackLocale,
			showPrimaryLocale,
			trailingSlash,
			run,
			translations,
			translationLoadingRules,
			translationDirectory,
			routes,
		}: Partial<AstroI18nConfig> = {},
		path = "",
	) {
		this.primaryLocale = primaryLocale || "en"
		this.secondaryLocales = secondaryLocales || []
		this.fallbackLocale = fallbackLocale ?? (primaryLocale || "")
		this.showPrimaryLocale = showPrimaryLocale || false
		this.trailingSlash = trailingSlash || "never"
		this.run = run || "client+server"
		this.translations = translations || {}
		this.translationLoadingRules = translationLoadingRules || []
		this.translationDirectory = translationDirectory || {}
		this.routes = routes || {}
		this.path = path || ""
	}

	get pages() {
		return Object.keys(this.translations).filter((group) =>
			group.startsWith("/"),
		)
	}

	static async fromFilesystem(configPath: string | null = null) {
		const { fileURLToPath } = await AsyncNode.url

		// find from PWD
		if (!configPath) {
			let pwd = ""

			if (typeof process !== "undefined") {
				pwd = process.env["PWD"] || ""
			}

			configPath = await autofindAstroI18nConfig(await toPosixPath(pwd))
		}

		// find from CWD
		if (!configPath) {
			let cwd = ""

			if (typeof process !== "undefined") {
				cwd = process.cwd()
			}

			configPath = await autofindAstroI18nConfig(await toPosixPath(cwd))
		}

		// find from current module
		if (!configPath) {
			let filename = ""

			if (typeof import.meta.url === "string") {
				filename = fileURLToPath(import.meta.url)
			} else if (typeof __filename === "string") {
				filename = __filename
			}

			if (filename) {
				configPath = await autofindAstroI18nConfig(
					await toPosixPath(filename),
				)
			}
		}

		if (!configPath) throw new ConfigNotFound()

		const partialConfig = configPath.endsWith(".json")
			? await importJson(configPath)
			: (await importScript(configPath))["default"]

		assert(partialConfig, isPartialConfig, "AstroI18nConfig")

		return new Config(
			partialConfig,
			configPath,
		).loadFilesystemTranslations()
	}

	/**
	 * Loads all translations & routes from the filesystem and merges them into
	 * the config
	 */
	async loadFilesystemTranslations() {
		// find project root
		let root = await popPath(this.path)
		if (!(await hasAstroConfig(root))) {
			const found = await autofindProjectRoot(this.path)
			if (!found) throw new RootNotFound()
			root = found
		}

		const pages = await getProjectPages(root, this)
		// merging page translations & routes to the config
		for (const page of pages) {
			if (!this.translations[page.route]) {
				this.translations[page.route] = {}
			}
			merge(
				this.translations[page.route] ||
					throwError(new UnreachableCode()),
				page.translations,
			)
			if (!this.routes) this.routes = {}
			merge(this.routes, page.routes)
		}

		const groups = await getProjectTranslationGroups(root, this)
		// merging translation groups to the config
		merge(this.translations, groups)

		return this
	}

	toClientSideObject() {
		return {
			primaryLocale: this.primaryLocale,
			secondaryLocales: this.secondaryLocales,
			showPrimaryLocale: this.showPrimaryLocale,
			trailingSlash: this.trailingSlash,
		} as SerializedConfig
	}

	toObject() {
		return {
			primaryLocale: this.primaryLocale,
			secondaryLocales: this.secondaryLocales,
			fallbackLocale: this.fallbackLocale,
			showPrimaryLocale: this.showPrimaryLocale,
			trailingSlash: this.trailingSlash,
			run: this.run,
			translations: this.translations,
			translationLoadingRules: this.translationLoadingRules,
			translationDirectory: this.translationDirectory,
			routes: this.routes,
		}
	}

	toString() {
		return JSON.stringify(this.toObject(), null, "\t")
	}
}

export default Config

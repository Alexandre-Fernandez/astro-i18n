import { Regex } from "@lib/regex"
import Config from "@src/core/config/classes/config.class"
import Environment from "@src/core/state/enums/environment.enum"
import MissingConfigArgument from "@src/core/state/errors/missing-config-argument.error"
import UnreachableCode from "@src/errors/unreachable-code.error"
import TranslationBank from "@src/core/translation/classes/translation-bank.class"
import FormatterBank from "@src/core/translation/classes/formatter-bank.class"
import type { AstroI18nConfig } from "@src/core/config/types"
import type {
	Formatters,
	TranslationProperties,
} from "@src/core/translation/types"

class AstroI18n {
	environment: Environment

	#locale = ""

	#route = ""

	#config = new Config()

	#translations = new TranslationBank()

	#formatters = new FormatterBank()

	constructor() {
		if (
			typeof process === "object" &&
			typeof process.versions === "object" &&
			typeof process.versions.node !== "undefined"
		) {
			this.environment = Environment.NODE
		} else if (typeof window === "undefined") {
			this.environment = Environment.NONE
		} else {
			this.environment = Environment.BROWSER
		}
	}

	get route() {
		return this.#route
	}

	set route(route: string) {
		this.#route = route
		this.#locale = this.extractRouteLocale(route)
	}

	get locale() {
		return this.#locale
	}

	get locales() {
		return [this.#config.primaryLocale, ...this.#config.secondaryLocales]
	}

	get primaryLocale() {
		return this.#config.primaryLocale
	}

	get secondaryLocales() {
		return this.#config.secondaryLocales
	}

	extractRouteLocale(route: string) {
		const pattern = Regex.fromString(
			`\\/?(${this.locales.join("|")})(?:\\/.*)?$`,
		)
		const { match } = pattern.match(route) || {}
		return match?.[1] || this.primaryLocale
	}

	/**
	 * Initializes state accordingly to the environment (node, browser, etc)
	 * where it's runned.
	 * For example in a node environment it might parse the config from the
	 * filesystem.
	 */
	async init(
		config?: Partial<AstroI18nConfig> | string,
		formatters: Formatters = {},
	) {
		switch (this.environment) {
			case Environment.NODE: {
				if (typeof config !== "object") {
					this.#config = await Config.fromFilesystem(config)
					break
				}
				this.#config = new Config(config)
				break
			}
			case Environment.BROWSER: {
				break
			}
			case Environment.NONE: {
				if (typeof config !== "object") {
					throw new MissingConfigArgument()
				}
				this.#config = new Config(config)
				break
			}
			default: {
				throw new UnreachableCode()
			}
		}

		this.#translations = TranslationBank.fromConfig(
			this.#config.translations,
		)

		this.#formatters = new FormatterBank(formatters)
	}

	t(
		key: string,
		properties: TranslationProperties,
		options: { route?: string; locale?: string; formatters?: Formatters },
	) {
		const { route, locale, formatters } = options

		return this.#translations.get(
			key,
			route || this.route,
			locale || this.locale,
			properties,
			formatters
				? new FormatterBank({
						...this.#formatters.custom,
						...formatters,
				  }).toObject()
				: this.#formatters.toObject(),
		)
	}

	toHtml() {
		return `<script type="text/json"></script>`
	}
}

export default AstroI18n

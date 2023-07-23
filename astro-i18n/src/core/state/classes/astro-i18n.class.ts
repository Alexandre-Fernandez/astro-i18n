import { Regex } from "@lib/regex"
import Config from "@src/core/config/classes/config.class"
import Environment from "@src/core/state/enums/environment.enum"
import MissingConfigArgument from "@src/core/state/errors/missing-config-argument.error"
import TranslationBank from "@src/core/translation/classes/translation-bank.class"
import FormatterBank from "@src/core/translation/classes/formatter-bank.class"
import InvalidEnvironment from "@src/core/state/errors/invalid-environment.error"
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

	#isServerSideInit = false

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
			/* 
				INITIALIZE BROWSER STATE HERE
			*/
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

	get internals() {
		return {
			serverInit: this.#serverInit.bind(this),
			isServerSideInit: () => this.#isServerSideInit,
			toHtml: this.#toHtml.bind(this),
		}
	}

	extractRouteLocale(route: string) {
		const pattern = Regex.fromString(
			`\\/?(${this.locales.join("|")})(?:\\/.*)?$`,
		)
		const { match } = pattern.match(route) || {}
		return match?.[1] || this.primaryLocale
	}

	/**
	 * Initializes state in the server accordingly to the environment (node,
	 * serverless, etc) where it's runned.
	 * For example in a node environment it might parse the config from the
	 * filesystem.
	 */
	async #serverInit(
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
			case Environment.NONE: {
				if (typeof config !== "object") {
					throw new MissingConfigArgument()
				}
				this.#config = new Config(config)
				break
			}
			default: {
				throw new InvalidEnvironment(
					"Cannot initialize server in a browser environment.",
				)
			}
		}

		this.#translations = TranslationBank.fromConfig(this.#config)

		this.#formatters = new FormatterBank(formatters)

		this.#isServerSideInit = true
	}

	#browserInit() {
		//
	}

	/**
	 * Gets the appropriate interpolated translation for the given key,
	 * properties and options.
	 * If multiple keys are the same, for example if you have the same key in
	 * the common translations and in your route translations, then the most
	 * specific one will be used (the route translations in the previous
	 * example).
	 */
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

	#toHtml() {
		return `<script type="application/json"></script>`
	}
}

export default AstroI18n

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
import SegmentBank from "@src/core/routing/classes/segment-bank.class"

class AstroI18n {
	environment: Environment

	#locale = ""

	#route = ""

	#config = new Config()

	#translations = new TranslationBank()

	#segments = new SegmentBank()

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
		const { locale, route: localelessRoute } =
			this.#splitLocaleAndRoute(route)
		this.#route = localelessRoute
		this.#locale = locale
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
		return this.#splitLocaleAndRoute(route).locale
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

		this.#segments = SegmentBank.fromConfig(this.#config)

		this.#formatters = new FormatterBank(formatters)

		this.#isServerSideInit = true
	}

	#browserInit() {
		//
	}

	test() {
		// console.log(this.#translations.toString())
		console.log(this.#segments.toString())
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
		properties: TranslationProperties = {},
		options: {
			route?: string
			locale?: string
			formatters?: Formatters
		} = {},
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

	l(
		route: string,
		parameters: Record<string, string> = {},
		options: {
			targetLocale?: string
			routeLocale?: string
		} = {},
	) {
		const { targetLocale, routeLocale } = {
			targetLocale: this.locale,
			...options,
		}

		// retrieving segments only
		const segments = route.replace(/^\//, "").replace(/\/$/, "").split("/")

		// removing locale
		const extractedLocale = this.locales.includes(segments[0] || "")
			? segments.shift() || ""
			: ""

		// detecting route locale
		const segmentsLocale =
			routeLocale ||
			extractedLocale ||
			this.#detectSegmentsLocale(segments) ||
			this.primaryLocale

		// translating segments
		let translatedRoute = segments
			.map(
				(segment) =>
					this.#segments.get(segmentsLocale, targetLocale, segment) ||
					segment,
			)
			.join("/")

		// replacing params
		const params = Object.entries(parameters)
		if (params.length > 0) {
			for (const [param, value] of params) {
				translatedRoute = translatedRoute.replace(`[${param}]`, value)
			}
		}

		// adding back locale
		if (
			this.#config.showPrimaryLocale ||
			targetLocale !== this.primaryLocale
		) {
			translatedRoute = `${targetLocale}/${translatedRoute}`
		}

		// adding trailing slash
		if (this.#config.trailingSlash === "always") {
			translatedRoute += "/"
		}

		return `/${translatedRoute}`
	}

	#detectSegmentsLocale(segments: string[]) {
		const scores: { [locale: string]: number } = {}

		for (const segment of segments) {
			for (const locale of this.#segments.getSegmentLocales(segment)) {
				if (!scores[locale]) scores[locale] = 0
				scores[locale] += 1
			}
		}

		const current = {
			locale: "",
			score: 0,
			isExAequo: true,
		}
		for (const [locale, score] of Object.entries(scores)) {
			if (score > current.score) {
				current.locale = locale
				current.score = score
				current.isExAequo = false
				continue
			}
			if (score === current.score) current.isExAequo = true
		}

		return current.isExAequo ? null : current.locale || null
	}

	#splitLocaleAndRoute(route: string) {
		if (!route.startsWith("/")) route = `/${route}`
		const pattern = Regex.fromString(
			`\\/(${this.locales.join("|")})(?:\\/.*)?$`,
		)
		const { match } = pattern.match(route) || {}
		const locale = match?.[1] || this.primaryLocale
		return {
			locale,
			route: route.replace(`/${locale}`, "") || "/",
		}
	}

	#toHtml() {
		return `<script type="application/json"></script>`
	}
}

export default AstroI18n

import { Regex } from "@lib/regex"
import Config from "@src/core/config/classes/config.class"
import Environment from "@src/core/state/enums/environment.enum"
import TranslationBank from "@src/core/translation/classes/translation-bank.class"
import FormatterBank from "@src/core/translation/classes/formatter-bank.class"
import InvalidEnvironment from "@src/core/state/errors/invalid-environment.error"
import SegmentBank from "@src/core/routing/classes/segment-bank.class"
import type { AstroI18nConfig } from "@src/core/config/types"
import type {
	Formatters,
	TranslationProperties,
} from "@src/core/translation/types"
import type { SerializedAstroI18n } from "@src/core/state/types"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import AlreadyInitialized from "@src/core/state/errors/already-initialized.error"
import NoFilesystem from "@src/core/state/errors/no-filesystem.error"
import SerializedStateNotFound from "@src/core/state/errors/serialized-state-not-found.error"
import { assert } from "@lib/ts/guards"
import { isSerializedAstroI18n } from "@src/core/state/guards/serialized-astro-i18n.guard"

class AstroI18n {
	static #scriptId = `__${PACKAGE_NAME}__`

	environment: Environment

	#locale = ""

	#route = ""

	#config = new Config()

	#translations = new TranslationBank()

	#segments = new SegmentBank()

	#formatters = new FormatterBank()

	#isInitialized = false

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
			this.#browserInit()
		}
	}

	get route() {
		return this.#route
	}

	set route(route: string) {
		const { locale, route: localelessRoute } =
			this.#splitLocaleAndRoute(route)
		this.#route = localelessRoute
		this.#locale =
			locale ||
			this.#detectSegmentsLocale(
				this.#getRouteSegments(localelessRoute),
			) ||
			this.primaryLocale
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

	get isInitialized() {
		return this.#isInitialized
	}

	get internals() {
		return {
			toHtml: this.#toHtml.bind(this),
			config: this.#config,
		}
	}

	/**
	 * Initializes state in the server accordingly to the environment where it's
	 * runned.
	 * For example in a node environment it might parse the config from the
	 * filesystem.
	 * It will throw in the browser.
	 */
	async initialize(
		config: Partial<AstroI18nConfig> | string | undefined = undefined,
		formatters: Formatters = {},
	) {
		if (this.#isInitialized) throw new AlreadyInitialized()

		switch (this.environment) {
			case Environment.NODE: {
				if (typeof config !== "object") {
					this.#config = await Config.fromFilesystem(config || null)
					break
				}
				this.#config = new Config(config)
				break
			}
			case Environment.NONE: {
				if (typeof config === "string") {
					throw new NoFilesystem(
						"Cannot load config from filesystem in a non-node environment.",
					)
				}
				this.#config = new Config(config || {})
				break
			}
			default: /* Environment.BROWSER */ {
				throw new InvalidEnvironment(
					"Cannot initialize in a browser environment.",
				)
			}
		}

		this.#translations = TranslationBank.fromConfig(this.#config)
		this.#segments = SegmentBank.fromConfig(this.#config)
		this.#formatters = new FormatterBank(formatters)
		this.#isInitialized = true
	}

	/**
	 * @return The `route` locale or `null`. It will also return `null` if the
	 * locale is not included in `this.locales`
	 */
	extractRouteLocale(route: string) {
		return this.#splitLocaleAndRoute(route).locale
	}

	#browserInit() {
		const script = document.querySelector(`#${AstroI18n.#scriptId}`)
		if (!script || !script.textContent) {
			throw new SerializedStateNotFound()
		}
		const serialized: unknown = JSON.parse(script.textContent)
		assert(serialized, isSerializedAstroI18n)

		//
		console.log(serialized)
	}

	test() {
		console.log(
			JSON.stringify(
				this.#translations.toClientSideObject(this.route),
				null,
				4,
			),
		)
		// console.log(this.#segments.toString())
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
		parameters: Record<string, unknown> = {},
		options: {
			targetLocale?: string
			routeLocale?: string
		} = {},
	) {
		const { targetLocale, routeLocale } = options

		// retrieving segments only
		const segments = this.#getRouteSegments(route)

		// removing locale
		const extractedLocale = this.locales.includes(segments[0] || "")
			? segments.shift() || ""
			: ""

		// detecting the locale of the given route variable
		const locale =
			routeLocale ||
			extractedLocale ||
			this.#detectSegmentsLocale(segments) ||
			this.primaryLocale

		// detecting the locale of the current page
		const target = targetLocale || this.locale

		// translating segments
		let translatedRoute = segments
			.map(
				(segment) =>
					this.#segments.get(segment, locale, target) || segment,
			)
			.join("/")

		// replacing params
		const params = Object.entries(parameters)
		if (params.length > 0) {
			for (const [param, value] of params) {
				translatedRoute = translatedRoute.replace(
					`[${param}]`,
					String(value).replace("/", ""),
				)
			}
		}

		// adding back locale
		if (this.#config.showPrimaryLocale || target !== this.primaryLocale) {
			translatedRoute = translatedRoute
				? `${target}/${translatedRoute}`
				: target
		}

		// adding trailing slash
		if (this.#config.trailingSlash === "always") {
			translatedRoute += "/"
		}

		return translatedRoute.startsWith("/")
			? translatedRoute
			: `/${translatedRoute}`
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
		const locale = match?.[1] || null
		return {
			locale,
			route: locale
				? route.replace(`/${locale}`, "") || "/"
				: route || "/",
		}
	}

	#getRouteSegments(route: string) {
		return route.replace(/^\//, "").replace(/\/$/, "").split("/")
	}

	#toHtml() {
		const serialized: SerializedAstroI18n = {
			locale: this.#locale,
			route: this.#route,
			config: this.#config.toClientSideObject(),
			translations: this.#translations.toClientSideObject(this.route),
			segments: this.#segments.toClientSideObject(),
		}
		return `<script id="${
			AstroI18n.#scriptId
		}" type="application/json">${JSON.stringify(serialized)}</script>`
	}
}

export default AstroI18n

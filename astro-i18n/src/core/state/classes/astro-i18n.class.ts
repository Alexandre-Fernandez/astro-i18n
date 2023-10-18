import { never } from "@lib/error"
import { Regex } from "@lib/regex"
import { assert } from "@lib/ts/guards"
import Config from "@src/core/config/classes/config.class"
import Environment from "@src/core/state/enums/environment.enum"
import TranslationBank from "@src/core/translation/classes/translation-bank.class"
import FormatterBank from "@src/core/translation/classes/formatter-bank.class"
import InvalidEnvironment from "@src/core/state/errors/invalid-environment.error"
import SegmentBank from "@src/core/routing/classes/segment-bank.class"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import AlreadyInitialized from "@src/core/state/errors/already-initialized.error"
import NoFilesystem from "@src/core/state/errors/no-filesystem.error"
import SerializedStateNotFound from "@src/core/state/errors/serialized-state-not-found.error"
import { isSerializedAstroI18n } from "@src/core/state/guards/serialized-astro-i18n.guard"
import { deserializeTranslationMap } from "@src/core/translation/functions/translation.functions"
import { isUrl, pageRouteToRegex } from "@src/core/routing/functions"
import { ROUTE_PARAM_PATTERN } from "@src/core/routing/constants/routing-patterns.constants"
import { deserializeFormatters } from "@src/core/translation/functions/formatter.functions"
import NotInitialized from "@src/core/state/errors/not-initialized.error"
import type { SerializedAstroI18n } from "@src/core/state/types"
import type {
	AstroI18nConfig,
	ConfigRoutes,
	ConfigTranslationLoadingRules,
	ConfigTranslations,
} from "@src/core/config/types"
import type {
	Formatters,
	TranslationProperties,
} from "@src/core/translation/types"
import CannotRedirect from "@src/core/state/errors/cannot-redirect.error"

class AstroI18n {
	static #scriptId = `__${PACKAGE_NAME}__`

	#environment: Environment

	#locale = ""

	#route = ""

	#config = new Config()

	#translations = new TranslationBank()

	#segments = new SegmentBank()

	#formatters = new FormatterBank()

	#isInitialized = false

	/**
	 * `getStaticPaths` runs before the middleware the route cannot be
	 * initialized. Because of this we don't know the route and cannot apply the
	 * route isolation rules. Setting this property to true allows us to ignore
	 * page isolation rules inside getStaticPaths.
	 */
	#isGetStaticPaths = false

	/**
	 * Cache mapping a route such as `"/posts/my-post-slug"` to `"/posts/[id]"`.
	 * Routes in other locales also get mapped to the primary one.
	 */
	#routePageCache: Record<string, string> = {}

	/**
	 * The middleware will redirect here at the end of the response.
	 */
	#redirection: Response | null = null

	/**
	 * The current URL origin, set by the middleware.
	 */
	#origin = ""

	constructor() {
		if (
			typeof process === "object" &&
			typeof process.versions === "object" &&
			typeof process.versions.node !== "undefined"
		) {
			this.#environment = Environment.NODE
		} else if (typeof window === "undefined") {
			this.#environment = Environment.NONE
		} else {
			this.#environment = Environment.BROWSER
			if (this.#config.run === "client+server") this.#initializeBrowser()
		}
	}

	/** The detected runtime environment. */
	get environment() {
		return this.#environment.toString()
	}

	/** The current page route. */
	get route() {
		if (this.#isGetStaticPaths) return ""
		return this.#route
	}

	/** The current page route. */
	set route(route: string) {
		if (isUrl(route)) route = new URL(route).pathname
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

	/** All page routes. For example: `["/", "/about", "/posts/[slug]"]` */
	get pages() {
		return this.#translations.getRouteGroups()
	}

	/**
	 * The equivalent page for the current route. For example if route is equal
	 * to `"/posts/my-cool-cat"` this could return `"/posts/[slug]"`.
	 */
	get page() {
		return this.#findRoutePage(this.route)
	}

	/** The current page locale. */
	get locale() {
		return this.#locale
	}

	/** All configured locales. */
	get locales() {
		return [this.#config.primaryLocale, ...this.#config.secondaryLocales]
	}

	/** The default/primary locale. */
	get primaryLocale() {
		return this.#config.primaryLocale
	}

	/** Locales other than the default/primary one. */
	get secondaryLocales() {
		return this.#config.secondaryLocales
	}

	/**
	 * The fallback locale, when a translation is missing in a locale the
	 * fallback locale will be used to find a replacement.
	 */
	get fallbackLocale() {
		return this.#config.fallbackLocale
	}

	/** True when astro-i18n is initialized. */
	get isInitialized() {
		return this.#isInitialized
	}

	/** If you touch this, you're on your own. */
	get internals() {
		return {
			toHtml: this.#toHtml.bind(this),
			config: this.#config,
			segments: this.#segments,
			translations: this.#translations,
			splitLocaleAndRoute: this.#splitLocaleAndRoute.bind(this),
			toString: this.#toString.bind(this),
			waitInitialization: this.#waitInitialization.bind(this),
			setPrivateProperties: this.#setPrivateProperties.bind(this),
			reinitalize: this.#reinitalize.bind(this),
			getAndClearRedirection: this.#getAndClearRedirection.bind(this),
		}
	}

	/**
	 * @param key The translation key, for example
	 * `"my.nested.translation.key"`.
	 * @param properties An object containing your interpolation variables
	 * and/or your variants, for example `{ variant: 3, interpolation: "text" }`.
	 * @param options `route`: Overrides the current route, you will be able
	 * to access that route's translations. `locale`: Overrides the current
	 * locale, this allows you to control which language you want to translate
	 * to. `fallbackLocale`: Overrides the fallback locale.
	 */
	t(
		key: string,
		properties: TranslationProperties = {},
		options: {
			route?: string
			locale?: string
			fallbackLocale?: string
		} = {},
	) {
		if (!this.#isInitialized) throw new NotInitialized()
		const { route, locale, fallbackLocale } = options

		if (this.#isGetStaticPaths) {
			return this.#translations.get(
				key,
				"",
				locale || this.locale,
				fallbackLocale || this.fallbackLocale,
				properties,
				this.#formatters.toObject(),
				true,
			)
		}

		const page = route
			? this.#findRoutePage(route)
			: this.#findRoutePage(this.route)

		return this.#translations.get(
			key,
			page || "",
			locale || this.locale,
			fallbackLocale || this.fallbackLocale,
			properties,
			this.#formatters.toObject(),
		)
	}

	/**
	 * @param route A route in any of the configured languages, for example
	 * `"/en/my/english/route/[param]"`.
	 * @param parameters An object containing your route parameters, for example
	 * `{ slug: "my-blog-post-slug" }`.
	 * @param options `targetLocale`: Overrides the target locale. `routeLocale`:
	 * Overrides the given route locale, this is useful if astro-i18n cannot
	 * figure out the route's locale. `showPrimaryLocale`: Overrides the
	 * showPrimaryLocale parameter. `query`: Adds these query parameters at the
	 * end of the translated route.
	 */
	l(
		route: string,
		parameters: Record<string, unknown> = {},
		options: {
			targetLocale?: string
			routeLocale?: string
			showPrimaryLocale?: boolean
			query?: Record<string, unknown>
		} = {},
	) {
		if (!this.#isInitialized) throw new NotInitialized()
		const { targetLocale, routeLocale, showPrimaryLocale, query } = options

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
		const showLocale =
			showPrimaryLocale === undefined
				? this.#config.showPrimaryLocale ||
				  target !== this.primaryLocale
				: showPrimaryLocale
		if (showLocale) {
			translatedRoute = translatedRoute
				? `${target}/${translatedRoute}`
				: target
		}

		// adding trailing slash
		if (this.#config.trailingSlash === "always") {
			translatedRoute += "/"
		}

		// adding leading slash
		translatedRoute = translatedRoute.startsWith("/")
			? translatedRoute
			: `/${translatedRoute}`
		if (!query) return translatedRoute

		// adding query parameters
		const q: Record<string, string> = {}
		for (const [key, value] of Object.entries(query)) {
			q[key] = String(value)
		}
		const searchParams = new URLSearchParams(q).toString()
		return searchParams
			? `${translatedRoute}?${searchParams}`
			: translatedRoute
	}

	/** Adds new translations at runtime. */
	addTranslations(translations: ConfigTranslations) {
		this.#translations.addTranslations(translations)
		this.#clearRoutePageCache()
		return this
	}

	/** Adds new translation formatters at runtime. */
	addFormatters(formatters: Formatters) {
		this.#formatters.addFormaters(formatters)
		return this
	}

	/** Adds new translation loading rules at runtime. */
	addTranslationLoadingRules(
		translationLoadingRules: ConfigTranslationLoadingRules,
	) {
		this.#translations.addTranslationLoadingRules(translationLoadingRules)
		return this
	}

	/** Adds new route segment translations at runtime. */
	addRoutes(routes: ConfigRoutes) {
		this.#segments.addSegments(routes)
		this.#clearRoutePageCache()
		return this
	}

	/**
	 * Tries to parse one of the configured locales out of the given route.
	 * If no configured locale is found it will return \`null\`.
	 */
	extractRouteLocale(route: string) {
		return this.#splitLocaleAndRoute(route).locale
	}

	/**
	 * Redirects the user to the given destination.
	 */
	redirect(destination: string | URL, status = 301) {
		if (this.environment === Environment.BROWSER) throw new CannotRedirect()

		if (typeof destination === "string") {
			const url = isUrl(destination)
				? new URL(destination)
				: new URL(`${this.#origin}/${destination.replace(/^\//, "")}`)

			this.#redirection = Response.redirect(url, status)
			return
		}

		this.#redirection = Response.redirect(destination, status)
	}

	/** Initializes astro-i18n on the server-side. */
	async initialize(
		config: Partial<AstroI18nConfig> | string | undefined = undefined,
		formatters: Formatters = {},
	) {
		if (this.#isInitialized) throw new AlreadyInitialized()

		switch (this.#environment) {
			case Environment.NODE: {
				this.#config =
					typeof config === "object"
						? await new Config(config).loadFilesystemTranslations()
						: await Config.fromFilesystem(config)
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

	#initializeBrowser() {
		const script = document.querySelector(`#${AstroI18n.#scriptId}`)
		if (!script || !script.textContent) {
			throw new SerializedStateNotFound()
		}
		const serialized: unknown = JSON.parse(script.textContent)
		assert(serialized, isSerializedAstroI18n)

		this.#locale = serialized.locale
		this.#route = serialized.route
		this.#config = new Config(serialized.config)
		this.#translations = new TranslationBank(
			deserializeTranslationMap(serialized.translations),
		)
		this.#segments = new SegmentBank(
			serialized.segments,
			serialized.config.primaryLocale,
		)
		this.#formatters = new FormatterBank(
			deserializeFormatters(serialized.formatters),
		)
		this.#isInitialized = true

		script.remove()
	}

	async #waitInitialization() {
		const poll = (resolve: Function) => {
			if (this.#isInitialized) resolve()
			else setTimeout(() => poll(resolve), 25)
		}
		return new Promise(poll)
	}

	async #reinitalize(
		config: Partial<AstroI18nConfig> | string | undefined = undefined,
		formatters: Formatters = {},
	) {
		this.#isInitialized = false
		this.#translations.clear()
		this.#segments.clear()
		this.#formatters.clear()
		await this.initialize(config, formatters)
	}

	#getAndClearRedirection() {
		const temp = this.#redirection
		this.#redirection = null
		return temp
	}

	#setPrivateProperties(
		properties: {
			locale?: string
			route?: string
			isGetStaticPaths?: boolean
			origin?: string
		} = {},
	) {
		const { route, locale, isGetStaticPaths, origin } = {
			route: this.#route,
			locale: this.#locale,
			isGetStaticPaths: this.#isGetStaticPaths,
			origin: this.#origin,
			...properties,
		}
		this.#route = route
		this.#locale = locale
		this.#isGetStaticPaths = isGetStaticPaths
		this.#origin = origin
	}

	#findRoutePage(route: string) {
		if (this.#isGetStaticPaths) return null
		if (this.#routePageCache[route]) {
			return this.#routePageCache[route] || never()
		}
		const primaryLocaleRoute = this.l(route, undefined, {
			targetLocale: this.primaryLocale,
		})
		if (this.pages.includes(primaryLocaleRoute)) return primaryLocaleRoute
		let paramPage: string | null = null
		for (const page of this.pages) {
			if (!ROUTE_PARAM_PATTERN.test(page)) continue
			if (pageRouteToRegex(page).test(route)) {
				paramPage = page
				break
			}
		}
		if (!paramPage || !this.pages.includes(paramPage)) return null
		this.#routePageCache[route] = paramPage
		return paramPage
	}

	#clearRoutePageCache() {
		this.#routePageCache = {}
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
				? route.replace(`/${locale}`, "").replace(/\/$/, "") || "/"
				: route.replace(/\/$/, "") || "/",
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
			formatters: this.#formatters.toClientSideObject(),
		}
		return `<script id="${
			AstroI18n.#scriptId
		}" type="application/json">${JSON.stringify(serialized)}</script>`
	}

	#toString() {
		const formatters: Record<string, string> = {}
		for (const [key, fn] of Object.entries(this.#formatters.toObject())) {
			formatters[key] = fn.name
		}
		return JSON.stringify(
			{
				environment: this.environment,
				route: this.route,
				locale: this.locale,
				locales: this.locales,
				primaryLocale: this.primaryLocale,
				secondaryLocales: this.secondaryLocales,
				fallbackLocale: this.fallbackLocale,
				isInitialized: this.isInitialized,
				"#config": this.#config.toObject(),
				"#translations": this.#translations.toObject(),
				"#segments": this.#segments.toObject(),
				"#formatters": formatters,
			},
			null,
			"\t",
		)
	}
}

export default AstroI18n

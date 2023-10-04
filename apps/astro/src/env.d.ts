/// <reference types="astro/client" />

// ###> astro-i18n/type-generation ###
type PrimaryLocale = "en"
type SecondaryLocale = "fr"
type Locale = PrimaryLocale | SecondaryLocale
type RouteParameters = {"/page":undefined;"/404":undefined;"/":undefined;"/test":undefined;"/about":undefined;"/group":undefined;"/group/inner":undefined;"/product":undefined;"/product/[id]":{"id":unknown;};}
type Route = keyof RouteParameters
type TranslationVariables = {"commonBasic":object|undefined;"commonVariant":{"$priority"?:number;"n"?:number|string|boolean;"x"?:string;}|undefined;"commonInterpolation":{"format"?:unknown;"value"?:unknown;}|undefined;"commonInterpolationAlias":{"alias"?:unknown;"value"?:unknown;}|undefined;"commonInterpolationChained":{"alias"?:unknown;"value"?:unknown;}|undefined;"commonInterpolationCurrency":{"currencyCode"?:unknown;"value"?:unknown;}|undefined;"commonFallback":object|undefined;"nested.commonNested":object|undefined;"pageTranslation":object|undefined;"groupTranslation1":object|undefined;"groupTranslation2":object|undefined;"index-test":object|undefined;"about-test":object|undefined;"root-about-test":object|undefined;"root-about-test-2":object|undefined;"product-test":{"$priority"?:number;"n"?:number;}|undefined;"product-interpolation":{"test"?:unknown;}|undefined;"root-product-test":object|undefined;"[id]-test":object|undefined;}
type Translation = keyof TranslationVariables
type Environment = "none"|"node"|"browser"

declare module "astro-i18n" {
	export * from "astro-i18n/"
	/**
	 * @param key The translation key, for example `"my.nested.translation.key"`.
	 * @param properties An object containing your interpolation variables and/or your variants, for example `{ variant: 3, interpolation: "text" }`.
	 * @param options `route`: Overrides the current route, you will be able to access that route's translations. `locale`: Overrides the current locale, this allows you to control which language you want to translate to. `fallbackLocale`: Overrides the fallback locale.
	 */
	export function t<T extends Translation>(
		key: T | string & {},
		...args: undefined extends TranslationVariables[T]
			? [
				properties?: keyof TranslationVariables extends T 
					? Record<string, unknown> 
					: TranslationVariables[T], 
				options?: {
					route?: Route | string & {}
					locale?: Locale | string & {}
					fallbackLocale?: Locale | string & {}
				}
			]
			: [
				properties: TranslationVariables[T], 
				options?: {
					route?: Route | string & {}
					locale?: Locale | string & {}
					fallbackLocale?: Locale | string & {}
				}
			]
	): string
	/**
	 * @param route A route in any of the configured languages, for example `"/en/my/english/route/[param]"`.
	 * @param parameters An object containing your route parameters, for example `{ slug: "my-blog-post-slug" }`.
	 * @param options `targetLocale`: Overrides the target locale. `routeLocale`: Overrides the given route locale, this is useful if astro-i18n cannot figure out the route's locale.
	 */
	export function l<T extends Route>(
		route: T | string & {},
		...args: T extends keyof RouteParameters
			? undefined extends RouteParameters[T]
				? [
					parameters?: Record<string, string>, 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string 
					}
				]
				: [
					parameters: RouteParameters[T], 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string 
					}
				]
			: [
				parameters?: Record<string, string>, 
				options?: { 
					targetLocale?: string, 
					routeLocale?: string 
				}
			]
	): string
	type DeepStringRecord = {[key: string]:string|DeepStringRecord}
	type TranslationDirectory = {main?:string;pages?: string}
	export type Translations = {[group: string]:{[locale: string]: DeepStringRecord}}
	export type TranslationFormatters = {[formatterName: string]:(value:unknown,...args:unknown[])=>unknown}
	export type TranslationLoadingRules = {groups:string[];routes: string[]}[]
	export type SegmentTranslations = {[secondaryLocale: string]:{[segment: string]:string}}
	export interface AstroI18nConfig {primaryLocale:string;secondaryLocales:string[];fallbackLocale:string;showPrimaryLocale:boolean;trailingSlash:"always"|"never";run:"server"|"client+server";translations:Translations;translationLoadingRules:TranslationLoadingRules;translationDirectory:TranslationDirectory;routes:SegmentTranslations;}
	class AstroI18n {
		/** The current page route. */
		route: string
		/** The current page locale. */
		locale: Locale
		/** All configured locales. */
		locales: Locale[]
		/** The default/primary locale. */
		primaryLocale: PrimaryLocale
		/** Locales other than the default/primary one. */
		secondaryLocales: SecondaryLocale[]
		/** The fallback locale, when a translation is missing in a locale the fallback locale will be used to find a replacement. */
		fallbackLocale: Locale
		/** True when astro-i18n is initialized. */
		isInitialized: boolean
		/** The detected runtime environment. */
		environment: Environment
		/**
		 * @param key The translation key, for example `"my.nested.translation.key"`.
		 * @param properties An object containing your interpolation variables and/or your variants, for example `{ variant: 3, interpolation: "text" }`.
		 * @param options `route`: Overrides the current route, you will be able to access that route's translations. `locale`: Overrides the current locale, this allows you to control which language you want to translate to. `fallbackLocale`: Overrides the fallback locale.
		 */
		t<T extends Translation>(
			key: T | string & {},
			...args: undefined extends TranslationVariables[T]
				? [
					properties?: keyof TranslationVariables extends T 
						? Record<string, unknown> 
						: TranslationVariables[T], 
					options?: {
						route?: Route | string & {}
						locale?: Locale | string & {}
						fallbackLocale?: Locale | string & {}
					}
				]
				: [
					properties: TranslationVariables[T], 
					options?: {
						route?: Route | string & {}
						locale?: Locale | string & {}
						fallbackLocale?: Locale | string & {}
					}
				]
		): string
		/**
		 * @param route A route in any of the configured languages, for example `"/en/my/english/route/[param]"`.
		 * @param parameters An object containing your route parameters, for example `{ slug: "my-blog-post-slug" }`.
		 * @param options `targetLocale`: Overrides the target locale. `routeLocale`: Overrides the given route locale, this is useful if astro-i18n cannot figure out the route's locale.
		 */
		l<T extends Route>(
			route: T | string & {},
			...args: T extends keyof RouteParameters
				? undefined extends RouteParameters[T]
					? [
						parameters?: Record<string, string>, 
						options?: { 
							targetLocale?: string, 
							routeLocale?: string 
						}
					]
					: [
						parameters: RouteParameters[T], 
						options?: { 
							targetLocale?: string, 
							routeLocale?: string 
						}
					]
				: [
					parameters?: Record<string, string>, 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string 
					}
				]
		): string
		/** Adds new translations at runtime. */
		addTranslations(translations: Translations): this
		/** Adds new translation formatters at runtime. */
		addFormatters(translationFormatters: TranslationFormatters): this
		/** Adds new translation loading rules at runtime. */
		addTranslationLoadingRules(translationLoadingRules: TranslationLoadingRules): this
		/** Adds new route segment translations at runtime. */
		addRoutes(routes: SegmentTranslations): this
		/** Tries to parse one of the configured locales out of the given route. If no configured locale is found it will return `null`. */
		extractRouteLocale(route: string): string|null
		/** Initializes astro-i18n on the server-side. */
		initialize(config?: Partial<AstroI18nConfig> | string, formatters?: TranslationFormatters = {}): Promise<void>
	}
	export const astroI18n: AstroI18n
}
// ###< astro-i18n/type-generation ###

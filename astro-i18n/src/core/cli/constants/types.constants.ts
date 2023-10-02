export {}

/*
`declare module "${PACKAGE_NAME}" {
	export * from "${PACKAGE_NAME}/"
	
	export function ${L_FUNCTION}<Uri extends ${ROUTE_URI}>(
		route: Uri | string & {},
		...args: Uri extends keyof ${ROUTE_PARAMS}
			? undefined extends RouteParams[Uri]
				? [params?: Record<string, string>, targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
				: [params: ${ROUTE_PARAMS}[Uri], targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
			: [params?: Record<string, string>, targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
	): string
	
	export function ${T_FUNCTION}<Path extends ${TRANSLATION_PATH}>(
		path: Path | string & {},
		...args: undefined extends ${TRANSLATION_OPTIONS}[Path]
			? [options?: keyof ${TRANSLATION_OPTIONS} extends Path ? Record<string, unknown> : ${TRANSLATION_OPTIONS}[Path], langCode?: ${LANG_CODE}]
			: [options: ${TRANSLATION_OPTIONS}[Path], langCode?: ${LANG_CODE}]
	): string
	
	export function extractRouteLangCode(route: string): ${LANG_CODE} | undefined
	
	type ${TRANSLATION} = string | { [translationKey: string]: string | ${TRANSLATION} }
	type ${TRANSLATIONS} = { [langCode: string]: Record<string, ${TRANSLATION}> }
	type ${ROUTE_TRANSLATIONS} = { [langCode: string]: Record<string, string> }
	type ${INTERPOLATION_FORMATTER} = (value: unknown, ...args: unknown[]) => string
	class ${ASTRO_I18N} {
		defaultLangCode: ${DEFAULT_LANG_CODE}
		supportedLangCodes: ${SUPPORTED_LANG_CODE}[]
		showDefaultLangCode: boolean
		translations: ${TRANSLATIONS}
		routeTranslations: ${ROUTE_TRANSLATIONS}
		get langCodes(): ${LANG_CODE}[]
		get langCode(): ${LANG_CODE}
		set langCode(langCode: ${LANG_CODE})
		get formatters(): Record<string, ${INTERPOLATION_FORMATTER}>
		init(Astro: { url: URL }, formatters?: Record<string, ${INTERPOLATION_FORMATTER}>): void
		addTranslations(translations: ${TRANSLATIONS}): void
		addRouteTranslations(routeTranslations: ${ROUTE_TRANSLATIONS}): void
		getFormatter(name: string): ${INTERPOLATION_FORMATTER} | undefined
		setFormatter(name: string, formatter: ${INTERPOLATION_FORMATTER}): void
		deleteFormatter(name: string): void
	}
	export const astroI18n: AstroI18n
}`
*/

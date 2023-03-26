import type { ReplaceProperties } from "$lib/typescript-helpers"

// AstroI18nConfig
export type UninitializedAstroI18nConfig = {
	defaultLangCode: string
	supportedLangCodes: string[]
	showDefaultLangCode: boolean
	trailingSlash: "always" | "never" | undefined
	translations: UninitializedTranslationMap
	routeTranslations: UninitializedRouteTranslationMap
}
export type AstroI18nConfig = ReplaceProperties<
	UninitializedAstroI18nConfig,
	{
		translations: TranslationMap
		routeTranslations: RouteTranslationMap
	}
>

// TranslationMap
export type UninitializedTranslationMap = {
	[langCode: string]: string | Record<string, Translation>
}
export type TranslationMap = {
	[langCode: string]: Record<string, Translation>
}

// RouteTranslationMap
export type UninitializedRouteTranslationMap = {
	[langCode: string]: string | Record<string, string>
}
export type RouteTranslationMap = {
	[langCode: string]: Record<string, string>
}

export type Translation =
	| string
	| {
			[translationKey: string]: string | Translation
	  }

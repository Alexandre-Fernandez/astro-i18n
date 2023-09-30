import type { DeepStringRecord } from "@src/core/translation/types"

export interface AstroI18nConfig {
	primaryLocale: string

	secondaryLocales: string[]

	fallbackLocale: string

	showPrimaryLocale: boolean

	trailingSlash: "always" | "never"

	run: "server" | "client+server"

	translations: ConfigTranslations

	translationLoadingRules: ConfigTranslationLoadingRules

	translationDirectory: ConfigTranslationDirectory

	routes: ConfigRoutes
}

export type ConfigTranslationLoadingRules = {
	/** Regex patterns for matching groups to load. */
	groups: string[]
	/** Regex patterns where groups will be loaded. */
	routes: string[]
}[]

export type ConfigTranslationDirectory = {
	main?: string
	pages?: string
}

export type ConfigTranslations = {
	[group: string]: {
		[locale: string]: DeepStringRecord
	}
}

export type ConfigRoutes = {
	[secondaryLocale: string]: {
		[segment: string]: string
	}
}

export type SerializedConfig = {
	primaryLocale: string
	secondaryLocales: string[]
	showPrimaryLocale: boolean
	trailingSlash: "always" | "never"
}

import type { DeepStringRecord } from "@src/core/translation/types"

export interface AstroI18nConfig {
	primaryLocale: string

	secondaryLocales: string[]

	showPrimaryLocale: boolean

	trailingSlash: "always" | "never"

	run: "server" | "client+server"

	translations: ConfigTranslations

	routes: ConfigRoutes
}

export type ConfigTranslations = {
	[namespace: string]: {
		[locale: string]: DeepStringRecord
	}
} & {
	$load?: {
		/** Namespaces to load. */
		namespaces: string[]
		/** Regex patterns where namespaces will be loaded. */
		routes: string[]
	}[]
	$directory?: {
		main?: string
		pages?: string
	}
}

export type ConfigRoutes = {
	[secondaryLocale: string]: {
		[segment: string]: string
	}
} & {
	$restrict?: {
		/** Segments to restrict. */
		segments: string[]
		/** Regex patterns where segments will be available. */
		routes: string[]
	}[]
}

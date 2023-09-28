import type {
	LOAD_DIRECTIVES_KEY,
	TRANSLATION_DIRECTORIES_KEY,
} from "@src/core/config/constants/config.constants"
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
	[group: string]: {
		[locale: string]: DeepStringRecord
	}
} & {
	[LOAD_DIRECTIVES_KEY]?: {
		/** Groups to load. */
		groups: string[]
		/** Regex patterns where groups will be loaded. */
		routes: string[]
	}[]
	[TRANSLATION_DIRECTORIES_KEY]?: {
		main?: string
		pages?: string
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

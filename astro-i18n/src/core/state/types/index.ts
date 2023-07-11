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

export type DeepStringRecord = {
	[key: string]: string | DeepStringRecord
}

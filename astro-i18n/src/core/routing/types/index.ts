export type SegmentTranslations = {
	[locale: string]: {
		[untranslated: string]: {
			[otherLocale: string]: string
		}
	}
}

export type RestrictDirectives = {
	[route: string]: string[]
}

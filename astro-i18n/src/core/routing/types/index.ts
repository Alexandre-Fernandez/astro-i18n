export type SegmentTranslations = {
	[locale: string]: {
		[untranslated: string]: {
			[otherLocale: string]: string
		}
	}
}

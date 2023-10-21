class MixedPrimarySecondary extends Error {
	constructor(primaryLocale?: string) {
		super(
			primaryLocale
				? `Your primaryLocale ("${primaryLocale}") cannot be contained in your secondaryLocales array.`
				: `Your primaryLocale cannot be contained in your secondaryLocales array.`,
		)
	}
}

export default MixedPrimarySecondary

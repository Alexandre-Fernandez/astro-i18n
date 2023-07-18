import type { ConfigTranslations } from "@src/core/config/types"

class TranslationDictionary {
	static fromConfig(translations: ConfigTranslations) {
		//
	}
}

/*
export type TranslationBank = {
	[namespace: string]: {
		[locale: string]: ComputedTranslations
	}
}

export type ComputedTranslations = {
	[key: string]: {
		default?: string
		variants: Variant[]
	}
}

*/

export default TranslationDictionary

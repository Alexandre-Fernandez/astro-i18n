import type { ConfigTranslations } from "@src/core/config/types"

class TranslationBank {
	static fromConfig(translations: ConfigTranslations) {
		//
	}
}

/*
export type TranslationMap = {
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

export default TranslationBank

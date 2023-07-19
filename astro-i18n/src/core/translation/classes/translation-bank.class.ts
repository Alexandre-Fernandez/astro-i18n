import { Regex } from "@lib/regex"
import { categorizeConfigTranslationsGroups } from "@src/core/config/functions/config.functions"
import type { ConfigTranslations } from "@src/core/config/types"
import { computeDeepStringRecord } from "@src/core/translation/functions/translation.functions"
import type {
	LoadDirectives,
	TranslationMap,
} from "@src/core/translation/types"

class TranslationBank {
	#loadDirectives: LoadDirectives = {}

	#translations: TranslationMap

	constructor(
		translations: TranslationMap,
		loadDirectives: LoadDirectives = {},
	) {
		this.#translations = translations
		this.#loadDirectives = loadDirectives
	}

	static fromConfig(translations: ConfigTranslations) {
		const translationMap: TranslationMap = {}
		const loadDirectives: LoadDirectives = {}
		const {
			$load,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			$directory, // we don't need this
			...groups
		} = translations

		for (const [key, value] of Object.entries(groups)) {
			if (!translationMap[key]) translationMap[key] = {}
			for (const [locale, deepStringRecord] of Object.entries(value)) {
				translationMap[key]![locale] =
					computeDeepStringRecord(deepStringRecord)
			}
		}

		if ($load) {
			const { routes } = categorizeConfigTranslationsGroups(translations)

			for (const directive of $load) {
				// find which groups need to be loaded
				let matchedGroups: string[] = []
				for (const groupSource of directive.groups) {
					const pattern = Regex.fromString(groupSource)
					// matched against every group including routes & common
					matchedGroups = Object.keys(groups).filter((group) =>
						pattern.test(group),
					)
				}
				// find the routes where the matched groups will be loaded
				for (const routeSource of directive.routes) {
					const pattern = Regex.fromString(routeSource)
					const matchedRoutes = routes.filter((route) =>
						pattern.test(route),
					)
					for (const route of matchedRoutes) {
						loadDirectives[route] = matchedGroups
					}
				}
			}
		}

		return new TranslationBank(translationMap, loadDirectives)
	}
}

/*
export type TranslationMap = {
	[group: string]: {
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

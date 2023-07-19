import { throwFalsy } from "@lib/error"
import { Regex } from "@lib/regex"
import { categorizeConfigTranslationsGroups } from "@src/core/config/functions/config.functions"
import {
	computeDeepStringRecord,
	interpolate,
} from "@src/core/translation/functions/translation.functions"
import type { ConfigTranslations } from "@src/core/config/types"
import type {
	ComputedTranslations,
	LoadDirectives,
	TranslationMap,
} from "@src/core/translation/types"

class TranslationBank {
	#loadDirectives: LoadDirectives = {}

	#translations: TranslationMap

	constructor(
		translations: TranslationMap = {},
		loadDirectives: LoadDirectives = {},
	) {
		this.#translations = translations
		this.#loadDirectives = loadDirectives
	}

	get(
		key: string,
		route: string,
		locale: string,
		properties: Record<string, unknown> = {},
	) {
		let translation: ComputedTranslations[string] | null = null

		// search key in loaded groups
		if (this.#loadDirectives[route]) {
			for (const group of this.#loadDirectives[route] || throwFalsy()) {
				const value = this.#translations[group]?.[locale]?.[key]
				if (!value) continue
				translation = value
				break
			}
		}
		// search key in route groups
		if (!translation && this.#translations[route]?.[locale]?.[key]) {
			translation =
				this.#translations[route]?.[locale]?.[key] || throwFalsy()
		}
		// search key in common group
		if (!translation && this.#translations["common"]?.[locale]?.[key]) {
			translation =
				this.#translations["common"]?.[locale]?.[key] || throwFalsy()
		}

		// find the best variant, defaults to the default value or key param if none
		const bestVariant = {
			score: Number.MIN_SAFE_INTEGER,
			value: translation?.default || key,
		}
		for (const variant of translation?.variants || []) {
			const score = variant.calculateMatchingScore(properties)
			if (score > bestVariant.score) {
				bestVariant.score = score
				bestVariant.value = variant.value
			}
		}

		return interpolate(bestVariant.value, properties)
	}

	static fromConfig(translations: ConfigTranslations) {
		const translationMap: TranslationMap = {}
		const loadDirectives: LoadDirectives = {}
		const {
			$load,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			$directory, // we don't need or want $directory
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

export default TranslationBank

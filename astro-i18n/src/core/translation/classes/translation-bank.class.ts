import { throwFalsy } from "@lib/error"
import { Regex } from "@lib/regex"
import { categorizeConfigTranslationsGroups } from "@src/core/config/functions/config.functions"
import {
	computeDeepStringRecord,
	interpolate,
} from "@src/core/translation/functions/translation.functions"
import {
	LOAD_DIRECTIVES_KEY,
	TRANSLATION_DIRECTORIES_KEY,
} from "@src/core/config/constants/config.constants"
import type {
	ComputedTranslations,
	Formatters,
	LoadDirectives,
	TranslationMap,
	TranslationProperties,
} from "@src/core/translation/types"
import type Config from "@src/core/config/classes/config.class"

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

	/**
	 * Create a TranslationBank from a config's translations.
	 */
	static fromConfig({ translations }: Config) {
		const translationMap: TranslationMap = {}
		const loadDirectives: LoadDirectives = {}
		const {
			[LOAD_DIRECTIVES_KEY]: $loadDirectives,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars, camelcase
			[TRANSLATION_DIRECTORIES_KEY]: __destructured_out__,
			...groups
		} = translations

		for (const [key, value] of Object.entries(groups)) {
			if (!translationMap[key]) translationMap[key] = {}
			for (const [locale, deepStringRecord] of Object.entries(value)) {
				translationMap[key]![locale] =
					computeDeepStringRecord(deepStringRecord)
			}
		}

		if ($loadDirectives) {
			const { routes } = categorizeConfigTranslationsGroups(translations)

			for (const directive of $loadDirectives) {
				// find which groups need to be loaded
				let matchedGroups: string[] = []
				for (const groupRegex of directive.groups) {
					const pattern = Regex.fromString(groupRegex)
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

	/**
	 * Get the appropriate translation for the given key, route, locale and
	 * properties.
	 * If no translation is found the key will be returned.
	 */
	get(
		key: string,
		route: string,
		locale: string,
		properties: TranslationProperties = {},
		formatters: Formatters = {},
	) {
		let translation: ComputedTranslations[string] | null = null

		// search key in the loaded groups for this route
		if (this.#loadDirectives[route]) {
			for (const group of this.#loadDirectives[route] || throwFalsy()) {
				const value = this.#translations[group]?.[locale]?.[key]
				if (!value) continue
				translation = value
				break
			}
		}
		// search key in corresponding route group
		if (!translation && this.#translations[route]?.[locale]?.[key]) {
			translation =
				this.#translations[route]?.[locale]?.[key] || throwFalsy()
		}
		// search key in the common group
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

		return interpolate(bestVariant.value, properties, formatters)
	}
}

export default TranslationBank

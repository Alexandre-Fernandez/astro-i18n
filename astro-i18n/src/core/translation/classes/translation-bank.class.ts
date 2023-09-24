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
import { setObjectProperty } from "@lib/object"
import { COMMON_TRANSLATIONS_GROUP } from "@src/core/translation/constants/translation.constants"

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

		// save all groups
		for (const [key, value] of Object.entries(groups)) {
			for (const [locale, deepStringRecord] of Object.entries(value)) {
				setObjectProperty(
					translationMap,
					[key, locale],
					computeDeepStringRecord(deepStringRecord),
				)
			}
		}

		// save directives
		if ($loadDirectives) {
			const { routes } = categorizeConfigTranslationsGroups(translations)

			for (const directive of $loadDirectives) {
				// find which groups need to be loaded
				const matchedGroups: string[] = []
				for (const groupRegex of directive.groups) {
					const pattern = Regex.fromString(groupRegex)
					// matched against every group including routes & common
					matchedGroups.push(
						...Object.keys(groups).filter((group) =>
							pattern.test(group),
						),
					)
				}
				// find the routes where the matched groups will be loaded
				for (const routeSource of directive.routes) {
					const pattern = Regex.fromString(routeSource)
					const matchedRoutes = routes.filter((route) =>
						pattern.test(route),
					)
					for (const route of matchedRoutes) {
						loadDirectives[route] = [...new Set(matchedGroups)]
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
		if (
			!translation &&
			this.#translations[COMMON_TRANSLATIONS_GROUP]?.[locale]?.[key]
		) {
			translation =
				this.#translations[COMMON_TRANSLATIONS_GROUP]?.[locale]?.[
					key
				] || throwFalsy()
		}

		// find the best variant, defaults to the default value or key param if none
		const bestVariant = {
			score: 0,
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

	toString() {
		return `#translations:\n${JSON.stringify(
			this.#translations,
			null,
			2,
		)}\n#loadDirectives:\n${JSON.stringify(this.#loadDirectives, null, 2)}`
	}
}

export default TranslationBank

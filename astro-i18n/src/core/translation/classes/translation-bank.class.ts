import { throwFalsy } from "@lib/error"
import { Regex } from "@lib/regex"
import { setObjectProperty } from "@lib/object"
import { categorizeConfigTranslationsGroups } from "@src/core/config/functions/config.functions"
import {
	computeDeepStringRecord,
	interpolate,
} from "@src/core/translation/functions/translation.functions"
import { COMMON_TRANSLATIONS_GROUP } from "@src/core/translation/constants/translation.constants"
import type Config from "@src/core/config/classes/config.class"
import type {
	ComputedTranslations,
	Formatters,
	LoadDirectives,
	SerializedTranslationMap,
	TranslationMap,
	TranslationProperties,
} from "@src/core/translation/types"
import type {
	ConfigTranslationLoadingRules,
	ConfigTranslations,
} from "@src/core/config/types"

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
	static fromConfig({ translations, translationLoadingRules }: Config) {
		return new TranslationBank()
			.addTranslations(translations)
			.addTranslationLoadingRules(translationLoadingRules)
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

	addTranslations(translations: ConfigTranslations) {
		for (const [group, locales] of Object.entries(translations)) {
			const localeEntries = Object.entries(locales)

			// empty record for no translations to be able to save route translation-less groups
			if (localeEntries.length === 0 && !this.#translations[group]) {
				this.#translations[group] = {}
				continue
			}

			for (const [locale, deepStringRecord] of localeEntries) {
				setObjectProperty(
					this.#translations,
					[group, locale],
					computeDeepStringRecord(deepStringRecord),
				)
			}
		}

		return this
	}

	addTranslationLoadingRules(
		translationLoadingRules: ConfigTranslationLoadingRules,
	) {
		if (translationLoadingRules.length === 0) return this

		const { routes } = categorizeConfigTranslationsGroups(
			this.#translations,
		)

		for (const rule of translationLoadingRules) {
			// find which groups need to be loaded
			const matchedGroups: string[] = []
			for (const groupRegex of rule.groups) {
				const pattern = Regex.fromString(groupRegex)
				// matched against every group including routes & common
				matchedGroups.push(
					...Object.keys(this.#translations).filter((group) =>
						pattern.test(group),
					),
				)
			}
			// find the routes where the matched groups will be loaded
			for (const routeSource of rule.routes) {
				const pattern = Regex.fromString(routeSource)
				const matchedRoutes = routes.filter((route) =>
					pattern.test(route),
				)
				for (const route of matchedRoutes) {
					if (!this.#loadDirectives[route]) {
						this.#loadDirectives[route] = [
							...new Set(matchedGroups),
						]
						continue
					}

					this.#loadDirectives[route] = [
						...new Set([
							...(this.#loadDirectives[route] || throwFalsy()),
							...matchedGroups,
						]),
					]
				}
			}
		}

		return this
	}

	toClientSideObject(route: string) {
		const translations: SerializedTranslationMap = {}
		// adding groups for this route
		if (this.#loadDirectives[route]) {
			for (const group of this.#loadDirectives[route] || throwFalsy()) {
				translations[group] = this.#translations[group] || {}
			}
		}
		// adding route translations
		if (this.#translations[route]) {
			translations[route] = this.#translations[route] || {}
		}
		// adding common translations
		if (this.#translations[COMMON_TRANSLATIONS_GROUP]) {
			translations[COMMON_TRANSLATIONS_GROUP] =
				this.#translations[COMMON_TRANSLATIONS_GROUP] || {}
		}
		return translations
	}
}

export default TranslationBank

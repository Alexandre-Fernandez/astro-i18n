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
	Primitive,
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
		fallbackLocale = "",
		properties: TranslationProperties = {},
		formatters: Formatters = {},
	) {
		let translation = this.#getValue(key, route, locale)

		if (!translation && fallbackLocale && fallbackLocale !== locale) {
			translation = this.#getValue(key, route, fallbackLocale)
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

	test() {
		console.log(JSON.stringify(this.#translations, null, 4))
	}

	getLocaleTranslationProperties(locale: string) {
		type TranslationProperty = {
			interpolationVars: string[]
			variantVars: { name: string; values: Primitive[] }[]
			isVariantRequired: boolean
		}
		const translationProperties: { [key: string]: TranslationProperty } = {}

		for (const group of Object.values(this.#translations)) {
			if (!group[locale]) continue

			const entries = Object.entries(group[locale] || throwFalsy())
			for (const [key, { default: defaultValue, variants }] of entries) {
				const props: TranslationProperty = {
					interpolationVars: [],
					variantVars: [],
					isVariantRequired: false,
				}
				const translationValues = [] // all the possible values for this key

				if (defaultValue === undefined) props.isVariantRequired = true
				else translationValues.push(defaultValue)

				if (variants.length > 0) {
					for (const { value, properties } of variants) {
						translationValues.push(value) // add variant value
						const knownProperties = new Set<string>()

						for (const { name, values } of properties) {
							if (knownProperties.has(name)) continue
							knownProperties.add(name)
							props.variantVars.push({ name, values })
							// see all the possible values for the same property name instead
						}
					}
				}
			}
		}
	}
	/*
	{
		common: {
			en: {
				[KEY]: {
					default?: string
					variants: {
						raw: string
						priority: number
						properties: {
							name: string
							values: (undefined | null | boolean | string | number)[] // VARIANT VALUES => {{ n: 3 }}
						}[]
						value: string
					}[]
				}
			}
		}
	}
	*/

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

	#getValue(key: string, route: string, locale: string) {
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

		return translation
	}
}

export default TranslationBank

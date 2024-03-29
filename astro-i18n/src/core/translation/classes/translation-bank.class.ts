import { never } from "@lib/error"
import { Regex } from "@lib/regex"
import { setObjectProperty } from "@lib/object"
import { categorizeConfigTranslationsGroups } from "@src/core/config/functions/config.functions"
import {
	computeDeepStringRecord,
	interpolate,
} from "@src/core/translation/functions/translation.functions"
import { COMMON_TRANSLATIONS_GROUP } from "@src/core/translation/constants/translation.constants"
import { INTERPOLATION_PATTERN } from "@src/core/translation/constants/translation-patterns.constants"
import { matchInterpolationVariables } from "@src/core/translation/functions/interpolation/interpolation-matching.functions"
import { ROUTE_PARAM_PATTERN } from "@src/core/routing/constants/routing-patterns.constants"
import type {
	ComputedTranslations,
	Formatters,
	LoadDirectives,
	Primitive,
	SerializedTranslationMap,
	TranslationMap,
	TranslationProperties,
	TranslationVariables,
} from "@src/core/translation/types"
import type {
	ConfigTranslationLoadingRules,
	ConfigTranslations,
} from "@src/core/config/types"
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
		page: string,
		locale: string,
		fallbackLocale = "",
		properties: TranslationProperties = {},
		formatters: Formatters = {},
		ignorePageIsolation = false,
	) {
		let translation = this.#getValue(key, page, locale, ignorePageIsolation)

		if (!translation && fallbackLocale && fallbackLocale !== locale) {
			translation = this.#getValue(
				key,
				page,
				fallbackLocale,
				ignorePageIsolation,
			)
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

	getRouteGroups() {
		return Object.keys(this.#translations).filter((group) =>
			group.startsWith("/"),
		)
	}

	getParamRouteGroups() {
		return Object.keys(this.#translations).filter(
			(group) => group.startsWith("/") && ROUTE_PARAM_PATTERN.test(group),
		)
	}

	/**
	 * For every translation of the given locale, returns all the interpolation
	 * and variant variables.
	 */
	getLocaleTranslationVariables(locale: string) {
		const translationProperties: Record<string, TranslationVariables> = {}

		for (const group of Object.values(this.#translations)) {
			if (!group[locale]) continue

			const entries = Object.entries(group[locale] || never())
			for (const [key, { default: defaultValue, variants }] of entries) {
				const props: TranslationVariables = {
					interpolationVars: [],
					variantVars: [],
					isVariantRequired: false,
				}
				const translationValues = [] // all the possible values for this key

				if (defaultValue === undefined) props.isVariantRequired = true
				else translationValues.push(defaultValue)

				// getting variant values and variables
				if (variants.length > 0) {
					const propertyValues: Record<string, Primitive[]> = {}

					for (const { value, properties } of variants) {
						translationValues.push(value) // add variant value
						// variant property values
						for (const { name, values } of properties) {
							propertyValues[name] = [
								...(propertyValues[name] || []),
								...values,
							]
						}
					}

					props.variantVars = Object.entries(propertyValues).map(
						([name, values]) => ({ name, values }),
					)
				}

				// getting interpolation variables from values
				for (const translation of translationValues) {
					INTERPOLATION_PATTERN.exec(translation, ({ match }) => {
						if (!match[1]) return
						props.interpolationVars = [
							...new Set([
								...props.interpolationVars,
								...matchInterpolationVariables(match[1]),
							]),
						]
					})
				}

				// adding new property
				if (!translationProperties[key]) {
					translationProperties[key] = props
					continue
				}

				// merging properties
				const { interpolationVars, variantVars, isVariantRequired } =
					translationProperties[key] || {}

				const mergedInterpolations = [
					...new Set([
						...(interpolationVars || []),
						...props.interpolationVars,
					]),
				]

				const mergedVariants: TranslationVariables["variantVars"] = []
				for (const variantVar of props.variantVars) {
					const existingVariantVar = variantVars?.find(
						(item) => item.name === variantVar.name,
					)
					mergedVariants.push(
						existingVariantVar
							? {
									name: variantVar.name,
									values: [
										...new Set([
											...(existingVariantVar?.values ||
												[]),
											...variantVar.values,
										]),
									],
							  }
							: variantVar,
					)
				}

				// adding merged properties
				translationProperties[key] = {
					interpolationVars: mergedInterpolations,
					variantVars: mergedVariants,
					isVariantRequired:
						(isVariantRequired || false) && props.isVariantRequired,
				}
			}
		}

		return translationProperties
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
							...(this.#loadDirectives[route] || never()),
							...matchedGroups,
						]),
					]
				}
			}
		}

		return this
	}

	clear() {
		this.#loadDirectives = {}
		this.#translations = {}
	}

	toClientSideObject(route: string) {
		const translations: SerializedTranslationMap = {}
		// adding groups for this route
		if (this.#loadDirectives[route]) {
			for (const group of this.#loadDirectives[route] || never()) {
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

	toObject() {
		return {
			loadDirectives: this.#loadDirectives,
			translations: this.#translations,
		}
	}

	toString() {
		return JSON.stringify(this.toObject(), null, "\t")
	}

	/**
	 * @param ignorePageIsolation If true it will ignore local page rules and
	 * search in every page and every group loaded in any page.
	 */
	#getValue(
		key: string,
		page: string,
		locale: string,
		ignorePageIsolation = false,
	) {
		let translation: ComputedTranslations[string] | null = null

		if (ignorePageIsolation) {
			const pages = this.getRouteGroups()
			// search key in all the groups to load for each page
			for (const page of pages) {
				for (const group of this.#loadDirectives[page] || []) {
					const value = this.#translations[group]?.[locale]?.[key]
					if (!value) continue
					translation = value
					break
				}
			}

			// search key in every page group
			if (!translation) {
				for (const page of pages) {
					if (this.#translations[page]?.[locale]?.[key]) {
						translation =
							this.#translations[page]?.[locale]?.[key] || never()
					}
				}
			}
		} else {
			//  search key inthe groups to load for the given page
			for (const group of this.#loadDirectives[page] || []) {
				const value = this.#translations[group]?.[locale]?.[key]
				if (!value) continue
				translation = value
				break
			}

			// search key in corresponding page group
			if (!translation && this.#translations[page]?.[locale]?.[key]) {
				translation =
					this.#translations[page]?.[locale]?.[key] || never()
			}
		}

		// search key in the common group
		if (
			!translation &&
			this.#translations[COMMON_TRANSLATIONS_GROUP]?.[locale]?.[key]
		) {
			translation =
				this.#translations[COMMON_TRANSLATIONS_GROUP]?.[locale]?.[
					key
				] || never()
		}

		return translation
	}
}

export default TranslationBank

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
						if (!loadDirectives[route]) {
							loadDirectives[route] = [...new Set(matchedGroups)]
							continue
						}

						loadDirectives[route] = [
							...new Set([
								...(loadDirectives[route] || throwFalsy()),
								...matchedGroups,
							]),
						]
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

	toClientSideObject(route: string) {
		const clientSideObject = {
			translations: {},
			loadDirectives: {},
		}
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

/*

#translations: {
   "common": {
     "en": {
       "commonBasic": {
         "default": "en.commonBasic",
         "variants": []
       },
       "commonVariant": {
         "default": "en.commonVariant (default value)",
         "variants": [
           {
             "raw": "n: -2",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   -2
                 ]
               }
             ],
             "value": "en.commonVariant (n === -2)"
           },
           {
             "raw": "n: 2",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   2
                 ]
               }
             ],
             "value": "en.commonVariant (n === 2)"
           },
           {
             "raw": "n: 2, x: 'text'",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   2
                 ]
               },
               {
                 "name": "x",
                 "values": [
                   "text"
                 ]
               }
             ],
             "value": "en.commonVariant (n === 2 && x === 'text')"
           },
           {
             "raw": "n: 3",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   3
                 ]
               }
             ],
             "value": "en.commonVariant (n === 3)"
           },
           {
             "raw": "n: 3, $priority: 100",
             "priority": 0.1,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   3
                 ]
               }
             ],
             "value": "en.commonVariant (n === 3 && $priority === 100)"
           },
           {
             "raw": "n: [4, 'text', true]",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   4,
                   "text",
                   true
                 ]
               }
             ],
             "value": "en.commonVariant (n === 4 || n === 'text' || 'n === true')"
           }
         ]
       },
       "commonInterpolation": {
         "default": "en.commonInterpolation ({# value>json(format>default(false)) #})",
         "variants": []
       },
       "commonInterpolationAlias": {
         "default": "en.commonInterpolation ({# value>json(format(alias)) #})",
         "variants": []
       },
       "commonInterpolationChained": {
         "default": "en.commonInterpolation ({# value>json(format(alias))>uppercase #})",
         "variants": []
       },
       "commonInterpolationCurrency": {
         "default": "en.commonInterpolation ({# value>intl_format_number({ style: 'currency', currency: currencyCode }, 'fr') #})",
         "variants": []
       },
       "nested.commonNested": {
         "default": "en.commonNested",
         "variants": []
       },
       "common": {
         "default": "common-en",
         "variants": []
       }
     },
     "fr": {
       "commonBasic": {
         "default": "fr.commonBasic",
         "variants": []
       },
       "commonVariant": {
         "default": "fr.commonVariant (default value)",
         "variants": [
           {
             "raw": "n: -2",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   -2
                 ]
               }
             ],
             "value": "fr.commonVariant (n === -2)"
           },
           {
             "raw": "n: 2",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   2
                 ]
               }
             ],
             "value": "fr.commonVariant (n === 2)"
           },
           {
             "raw": "n: 2, x: 'text'",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   2
                 ]
               },
               {
                 "name": "x",
                 "values": [
                   "text"
                 ]
               }
             ],
             "value": "fr.commonVariant (n === 2 && x === 'text')"
           },
           {
             "raw": "n: 3",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   3
                 ]
               }
             ],
             "value": "fr.commonVariant (n === 3)"
           },
           {
             "raw": "n: 3, $priority: 100",
             "priority": 0.1,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   3
                 ]
               }
             ],
             "value": "fr.commonVariant (n === 3 && $priority === 100)"
           },
           {
             "raw": "n: [4, 'text', true]",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   4,
                   "text",
                   true
                 ]
               }
             ],
             "value": "fr.commonVariant (n === 4 || n === 'text' || 'n === true')"
           }
         ]
       },
       "commonInterpolation": {
         "default": "fr.commonInterpolation ({# value>json(format>default(false)) #})",
         "variants": []
       },
       "commonInterpolationAlias": {
         "default": "fr.commonInterpolation ({# value>json(format(alias)) #})",
         "variants": []
       },
       "commonInterpolationChained": {
         "default": "fr.commonInterpolation ({# value>json(format(alias))>uppercase #})",
         "variants": []
       },
       "commonInterpolationCurrency": {
         "default": "fr.commonInterpolation ({# value>intl_format_number({ style: 'currency', currency: currencyCode }, 'fr') #})",
         "variants": []
       },
       "nested.commonNested": {
         "default": "fr.commonNested",
         "variants": []
       }
     }
   },
   "/page": {
     "en": {
       "pageTranslation": {
         "default": "en.pageTranslation",
         "variants": []
       }
     },
     "fr": {
       "pageTranslation": {
         "default": "fr.pageTranslation",
         "variants": []
       }
     }
   },
   "group1": {
     "en": {
       "groupTranslation1": {
         "default": "en.groupTranslation1",
         "variants": []
       }
     },
     "fr": {
       "groupTranslation1": {
         "default": "fr.groupTranslation1",
         "variants": []
       }
     }
   },
   "group2": {
     "en": {
       "groupTranslation2": {
         "default": "en.groupTranslation2",
         "variants": []
       }
     },
     "fr": {
       "groupTranslation2": {
         "default": "fr.groupTranslation2",
         "variants": []
       }
     }
   },
   "/": {
     "en": {
       "index-test": {
         "default": "index-test-en",
         "variants": []
       }
     }
   },
   "/about": {
     "en": {
       "about-test": {
         "default": "about-test-en",
         "variants": []
       },
       "root-about-test": {
         "default": "root-about-test-en",
         "variants": []
       },
       "root-about-test-2": {
         "default": "root-about-test-2-en",
         "variants": []
       }
     },
     "fr": {
       "about-test": {
         "default": "about-test-fr",
         "variants": []
       },
       "root-about-test": {
         "default": "root-about-test-fr",
         "variants": []
       },
       "root-about-test-2": {
         "default": "root-about-test-2-fr",
         "variants": []
       }
     }
   },
   "/product": {
     "en": {
       "product-test": {
         "default": "product-test-en (default)",
         "variants": [
           {
             "raw": "n: 2",
             "priority": 0,
             "properties": [
               {
                 "name": "n",
                 "values": [
                   2
                 ]
               }
             ],
             "value": "product-test-en (n: 2)"
           }
         ]
       },
       "product-interpolation": {
         "default": "I have '{# test>upper #}'",
         "variants": []
       },
       "root-product-test": {
         "default": "root-product-test-en",
         "variants": []
       }
     },
     "fr": {
       "product-test": {
         "default": "product-test-fr",
         "variants": []
       },
       "root-product-test": {
         "default": "root-product-test-fr",
         "variants": []
       }
     }
   },
   "/product/[id]": {
     "en": {
       "[id]-test": {
         "default": "[id]-test-en",
         "variants": []
       }
     }
   },
   "admin": {
     "en": {
       "admin": {
         "default": "admin-en",
         "variants": []
       }
     }
   }
 }

#loadDirectives: {
   "/group": [
     "group1",
     "group2"
   ],
   "/group/inner": [
     "group2"
   ]
 }
*/

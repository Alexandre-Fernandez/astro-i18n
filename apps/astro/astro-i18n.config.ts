import { defineAstroI18nConfig } from "astro-i18n"

export default defineAstroI18nConfig({
	primaryLocale: "en",
	secondaryLocales: ["fr"],
	showPrimaryLocale: false,
	translationLoadingRules: [
		{
			routes: ["/group$"],
			groups: ["^group"],
		},
		{
			routes: ["/group"],
			groups: ["^group2"],
		},
	],
	translationDirectory: {},
	translations: {
		common: {
			en: {
				commonBasic: "en.commonBasic",
				commonVariant: "en.commonVariant (default value)",
				"commonVariant{{ n: -2 }}": "en.commonVariant (n === -2)",
				"commonVariant{{ n: 2 }}": "en.commonVariant (n === 2)",
				"commonVariant{{ n: 2, x: 'text' }}":
					"en.commonVariant (n === 2 && x === 'text')",
				"commonVariant{{ n: 3 }}": "en.commonVariant (n === 3)",
				"commonVariant{{ n: 3, $priority: 100 }}":
					"en.commonVariant (n === 3 && $priority === 100)",
				"commonVariant{{ n: [4, 'text', true] }}":
					"en.commonVariant (n === 4 || n === 'text' || 'n === true')",
				commonInterpolation:
					"en.commonInterpolation ({# value>json(format>default(false)) #})",
				commonInterpolationAlias:
					"en.commonInterpolation ({# value>json(format(alias)) #})",
				commonInterpolationChained:
					"en.commonInterpolation ({# value>json(format(alias))>uppercase #})",
				commonInterpolationCurrency:
					"en.commonInterpolation ({# value>intl_format_number({ style: 'currency', currency: currencyCode }, 'fr') #})",
				commonFallback: "en.commonFallback",
				nested: {
					commonNested: "en.commonNested",
				},
			},
			fr: {
				commonBasic: "fr.commonBasic",
				commonVariant: "fr.commonVariant (default value)",
				"commonVariant{{ n: -2 }}": "fr.commonVariant (n === -2)",
				"commonVariant{{ n: 2 }}": "fr.commonVariant (n === 2)",
				"commonVariant{{ n: 2, x: 'text' }}":
					"fr.commonVariant (n === 2 && x === 'text')",
				"commonVariant{{ n: 3 }}": "fr.commonVariant (n === 3)",
				"commonVariant{{ n: 3, $priority: 100 }}":
					"fr.commonVariant (n === 3 && $priority === 100)",
				"commonVariant{{ n: [4, 'text', true] }}":
					"fr.commonVariant (n === 4 || n === 'text' || 'n === true')",
				commonInterpolation:
					"fr.commonInterpolation ({# value>json(format>default(false)) #})",
				commonInterpolationAlias:
					"fr.commonInterpolation ({# value>json(format(alias)) #})",
				commonInterpolationChained:
					"fr.commonInterpolation ({# value>json(format(alias))>uppercase #})",
				commonInterpolationCurrency:
					"fr.commonInterpolation ({# value>intl_format_number({ style: 'currency', currency: currencyCode }, 'fr') #})",
				nested: {
					commonNested: "fr.commonNested",
				},
			},
		},
		"/page": {
			en: {
				pageTranslation: "en.pageTranslation",
			},
			fr: {
				pageTranslation: "fr.pageTranslation",
			},
		},
		"/page/[id]": {
			en: {
				paramTranslation: "en.paramTranslation",
			},
			fr: {
				paramTranslation: "fr.paramTranslation",
			},
		},
		group1: {
			en: {
				groupTranslation1: "en.groupTranslation1",
			},
			fr: {
				groupTranslation1: "fr.groupTranslation1",
			},
		},
		group2: {
			en: {
				groupTranslation2: "en.groupTranslation2",
			},
			fr: {
				groupTranslation2: "fr.groupTranslation2",
			},
		},
	},
	routes: {
		fr: {
			about: "a-propos",
			product: "produit",
			inner: "interieur",
			group: "groupe",
		},
	},
})

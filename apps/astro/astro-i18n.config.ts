export default {
	primaryLocale: "en",
	secondaryLocales: ["fr"],
	translations: {
		$load: [
			{
				routes: ["/group"],
				groups: ["group"],
			},
		],
		common: {
			en: {
				commonBasic: "en.commonBasic",
				commonVariant: "en.commonVariant (default value)",
				"commonVariant{{ n: -2 }}": "en.commonVariant (n === -2)",
				"commonVariant{{ n: 2 }}": "en.commonVariant (n === 2)",
				commonInterpolation: "en.commonInterpolation ({# value #})",
				nested: {
					commonNested: "en.commonNested",
				},
			},
			fr: {
				commonBasic: "fr.commonBasic",
				commonVariant: "fr.commonVariant (default value)",
				"commonVariant{{ n: 0 }}": "fr.commonVariant (n === 0)",
				"commonVariant{{ n: 2 }}": "fr.commonVariant (n === 2)",
				commonInterpolation: "fr.commonInterpolation ({# value #})",
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
		group: {
			en: {
				groupTranslation: "en.groupTranslation",
			},
			fr: {
				groupTranslation: "fr.groupTranslation",
			},
		},
	},
	routes: {
		fr: {
			about: "a-propos",
			product: "produit",
		},
		$restrict: [
			{
				segments: ["a-propos"],
				routes: ["about"],
			},
		],
	},
}

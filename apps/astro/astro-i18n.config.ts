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

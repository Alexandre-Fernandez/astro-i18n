export default {
	primaryLocale: "en",
	secondaryLocales: ["fr"],
	translations: {},
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

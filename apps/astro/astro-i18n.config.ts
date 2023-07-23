export default {
	primaryLocale: "en",
	secondaryLocales: ["fr"],
	translations: {
		$load: [
			{
				routes: ["/product", "/"],
				groups: ["admin", "/about"],
			},
		],
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

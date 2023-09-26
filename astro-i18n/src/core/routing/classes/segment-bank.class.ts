/*
 type ConfigRoutes = {
	[secondaryLocale: string]: {
		[segment: string]: string
	}
} 
	===========>
type FullRouteTranslationMap = {
	[locale: string]: {
		[untranslated: string]: {
			[otherLocale: string]: string
		}
	}
}

{
	en: {
		about: {
			fr: "a-propos"
		}
	}
}
*/

import { ROUTE_RESTRICT_KEY } from "@src/core/routing/constants/routing.constants"
import { Regex } from "@lib/regex"
import type Config from "@src/core/config/classes/config.class"
import type {
	RestrictDirectives,
	SegmentTranslations,
} from "@src/core/routing/types"
import { setObjectProperty } from "@lib/object"

class SegmentBank {
	#restrictDirectives: RestrictDirectives

	#segments: SegmentTranslations

	constructor(
		translations: SegmentTranslations = {},
		restrictDirectives: RestrictDirectives = {},
	) {
		this.#segments = translations
		this.#restrictDirectives = restrictDirectives
	}

	static fromConfig({ routes, primaryLocale, pages }: Config) {
		const {
			[ROUTE_RESTRICT_KEY]: $restrictDirectives,
			...secondaryLocales
		} = routes

		const translations: SegmentTranslations = {
			[primaryLocale]: {},
		}
		const restrictDirectives: RestrictDirectives = {}

		// filling translations
		const entries = Object.entries(secondaryLocales)
		for (const [locale, segments] of entries) {
			const otherLocales = entries.filter(
				([loc]) => loc !== locale && loc !== primaryLocale,
			)

			for (const [primarySeg, localeSeg] of Object.entries(segments)) {
				// adding segment to the primary locale translations
				setObjectProperty(
					translations,
					[primaryLocale, primarySeg, locale],
					localeSeg,
				)

				// adding segment to the current secondary locale translations
				setObjectProperty(
					translations,
					[locale, localeSeg, primaryLocale],
					primarySeg,
				)

				// adding segment to all other locale translations
				for (const [otherLocale, otherSegments] of otherLocales) {
					if (otherSegments[primarySeg]) {
						setObjectProperty(
							translations,
							[locale, localeSeg, otherLocale],
							otherSegments[primarySeg],
						)
					}
				}
			}
		}

		if ($restrictDirectives) {
			const allSegments: string[] = []
			for (const [, segments] of entries) {
				for (const [segment, translated] of Object.entries(segments)) {
					// retrieving all segments
					allSegments.push(segment, translated)
				}
			}

			for (const directive of $restrictDirectives) {
				const matchedRoutes: string[] = []
				// find all matched routes
				for (const routeRegex of directive.routes) {
					const routePattern = Regex.fromString(routeRegex)
					matchedRoutes.push(
						...pages.filter((page) => routePattern.test(page)),
					)
				}
				// find all restricted segments
				const restrictedSegments: string[] = []
				for (const segmentRegex of directive.segments) {
					const segmentPattern = Regex.fromString(segmentRegex)
					restrictedSegments.push(
						...allSegments.filter((seg) =>
							segmentPattern.test(seg),
						),
					)
				}

				for (const route of matchedRoutes) {
					restrictDirectives[route] = [...new Set(restrictedSegments)]
				}
			}
		}

		return new SegmentBank(translations, restrictDirectives)
	}

	get(locale: string, targetLocale: string, segment: string) {
		//
	}

	getSegmentLocales(segment: string) {
		const locales: string[] = []

		for (const [locale, segments] of Object.entries(this.#segments)) {
			if (segments[segment]) {
				locales.push(locale)
			}
		}

		return locales
	}

	toString() {
		return `#segments:\n${JSON.stringify(
			this.#segments,
			null,
			2,
		)}\n#restrictDirectives:\n${JSON.stringify(
			this.#restrictDirectives,
			null,
			2,
		)}`
	}
}

export default SegmentBank

/*
#segments:
	{
	"en": {
		"about": {
			"fr": "a-propos"
		},
		"product": {
			"fr": "produit"
		},
		"inner": {
			"fr": "interieur"
		},
		"group": {
			"fr": "groupe"
		}
	},
	"fr": {
		"a-propos": {
			"en": "about"
		},
		"produit": {
			"en": "product"
		},
		"interieur": {
			"en": "inner"
		},
		"groupe": {
			"en": "group"
		}
	}
	}
#restrictDirectives:
	{
		"/about": [
			"a-propos"
		]
	}
*/

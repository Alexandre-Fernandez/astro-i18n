import { setObjectProperty } from "@lib/object"
import type Config from "@src/core/config/classes/config.class"
import type { SegmentTranslations } from "@src/core/routing/types"

class SegmentBank {
	#segments: SegmentTranslations

	constructor(translations: SegmentTranslations = {}) {
		this.#segments = translations
	}

	static fromConfig({ routes, primaryLocale }: Config) {
		const translations: SegmentTranslations = {
			[primaryLocale]: {},
		}

		// filling translations
		const entries = Object.entries(routes)
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

		return new SegmentBank(translations)
	}

	get(segment: string, segmentLocale: string, targetLocale: string) {
		return this.#segments[segmentLocale]?.[segment]?.[targetLocale] || null
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

	toClientSideObject() {
		return { ...this.#segments }
	}

	toString() {
		return JSON.stringify(this.#segments, null, 2)
	}
}

export default SegmentBank

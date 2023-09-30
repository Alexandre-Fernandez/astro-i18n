import { setObjectProperty } from "@lib/object"
import type Config from "@src/core/config/classes/config.class"
import type { ConfigRoutes } from "@src/core/config/types"
import type { SegmentTranslations } from "@src/core/routing/types"

class SegmentBank {
	#primaryLocale: string

	#segments: SegmentTranslations

	constructor(translations: SegmentTranslations = {}, primaryLocale = "") {
		this.#segments = translations
		this.#primaryLocale = primaryLocale
	}

	static fromConfig({ routes, primaryLocale }: Config) {
		return new SegmentBank({}, primaryLocale).addSegments(routes)
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

	addSegments(segments: ConfigRoutes) {
		const entries = Object.entries(segments)

		for (const [locale, segments] of entries) {
			const otherLocales = entries.filter(
				([loc]) => loc !== locale && loc !== this.#primaryLocale,
			)

			for (const [primarySeg, localeSeg] of Object.entries(segments)) {
				// adding segment to the primary locale translations
				setObjectProperty(
					this.#segments,
					[this.#primaryLocale, primarySeg, locale],
					localeSeg,
				)

				// adding segment to the current secondary locale translations
				setObjectProperty(
					this.#segments,
					[locale, localeSeg, this.#primaryLocale],
					primarySeg,
				)

				// adding segment to all other locale translations
				for (const [otherLocale, otherSegments] of otherLocales) {
					if (otherSegments[primarySeg]) {
						setObjectProperty(
							this.#segments,
							[locale, localeSeg, otherLocale],
							otherSegments[primarySeg],
						)
					}
				}
			}
		}

		return this
	}

	toClientSideObject() {
		return { ...this.#segments }
	}
}

export default SegmentBank

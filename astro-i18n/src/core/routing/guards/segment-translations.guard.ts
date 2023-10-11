import { isObject } from "@lib/ts/guards"
import type { SegmentTranslations } from "@src/core/routing/types"

export function isSegmentTranslations(
	segmentTranslations: unknown,
): segmentTranslations is SegmentTranslations {
	if (!isObject(segmentTranslations)) return false

	for (const untranslatedSegments of Object.values(segmentTranslations)) {
		if (!isObject(untranslatedSegments)) return false

		for (const otherLocales of Object.values(untranslatedSegments)) {
			if (!isObject(otherLocales)) return false

			for (const translation of Object.values(otherLocales)) {
				if (typeof translation !== "string") return false
			}
		}
	}

	return true
}

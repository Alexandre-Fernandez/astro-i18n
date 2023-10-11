import { isObject } from "@lib/ts/guards"
import { isSerializedConfig } from "@src/core/config/guards/config.guard"
import { isSegmentTranslations } from "@src/core/routing/guards/segment-translations.guard"
import { isSerializedFormatters } from "@src/core/translation/guards/serialized-formatters.guard"
import { isTranslationMap } from "@src/core/translation/guards/translation-map.guard"
import type { SerializedAstroI18n } from "@src/core/state/types"

export function isSerializedAstroI18n(
	serializedAstroI18n: unknown,
): serializedAstroI18n is SerializedAstroI18n {
	if (!isObject(serializedAstroI18n)) return false

	const entries = Object.entries(serializedAstroI18n)
	if (entries.length < 5) return false

	for (const [key, value] of entries) {
		switch (key) {
			case "locale": {
				if (typeof value !== "string") return false
				break
			}
			case "route": {
				if (typeof value !== "string") return false
				break
			}
			case "config": {
				if (!isSerializedConfig(value)) return false
				break
			}
			case "translations": {
				if (!isTranslationMap(value)) return false
				break
			}
			case "segments": {
				if (!isSegmentTranslations(value)) return false
				break
			}
			case "formatters": {
				if (!isSerializedFormatters(value)) return false
				break
			}
			default: {
				return false
			}
		}
	}

	return true
}

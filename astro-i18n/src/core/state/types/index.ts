import type { SerializedConfig } from "@src/core/config/types"
import type { SegmentTranslations } from "@src/core/routing/types"
import type { SerializedTranslationMap } from "@src/core/translation/types"

export type SerializedAstroI18n = {
	locale: string
	route: string
	config: SerializedConfig
	translations: SerializedTranslationMap
	segments: SegmentTranslations
}

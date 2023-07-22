import { isObject, isStringArray } from "@lib/ts/guards"
import { isDeepStringRecord } from "@src/core/translation/guards/deep-string-record.guard"
import {
	LOAD_DIRECTIVES_KEY,
	TRANSLATION_DIRECTORIES_KEY,
} from "@src/core/config/constants/config.constants"
import type { ConfigTranslations } from "@src/core/config/types"

export function isConfigTranslations(
	configTranslations: unknown,
): configTranslations is ConfigTranslations {
	if (!isObject(configTranslations)) return false

	for (const [key, value] of Object.entries(configTranslations)) {
		// is loader array:
		if (key === LOAD_DIRECTIVES_KEY) {
			if (!Array.isArray(value)) return false
			for (const loader of value) {
				if (!isObject(loader)) return false
				const entries = Object.entries(loader)
				if (entries.length < 2) return false
				for (const [loaderKey, array] of entries) {
					switch (loaderKey) {
						case "groups": {
							if (!isStringArray(array)) return false
							break
						}
						case "routes": {
							if (!isStringArray(array)) return false
							break
						}
						default: {
							return false
						}
					}
				}
			}
			continue
		}
		if (key === TRANSLATION_DIRECTORIES_KEY) {
			if (!isObject(value)) return false
			for (const [location, name] of Object.entries(value)) {
				if (typeof name !== "string") return false
				if (location !== "main" && location !== "pages") return false
			}
		}
		// is translations:
		if (!isObject(value)) return false
		for (const translations of Object.values(value)) {
			if (!isDeepStringRecord(translations)) return false
		}
	}

	return true
}

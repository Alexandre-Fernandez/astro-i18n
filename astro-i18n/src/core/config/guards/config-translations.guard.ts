import { isArray, isObject, isStringArray } from "@lib/ts/guards"
import { isDeepStringRecord } from "@src/core/translation/guards/deep-string-record.guard"
import type {
	ConfigTranslationDirectory,
	ConfigTranslationLoadingRules,
	ConfigTranslations,
} from "@src/core/config/types"

export function isConfigTranslations(
	configTranslations: unknown,
): configTranslations is ConfigTranslations {
	if (!isObject(configTranslations)) return false

	for (const value of Object.values(configTranslations)) {
		if (!isObject(value)) return false
		for (const translations of Object.values(value)) {
			if (!isDeepStringRecord(translations)) return false
		}
	}

	return true
}

export function isConfigTranslationLoadingRules(
	loadingRules: unknown,
): loadingRules is ConfigTranslationLoadingRules {
	if (!isArray(loadingRules)) return false

	for (const rule of loadingRules) {
		if (!isObject(rule)) return false
		const entries = Object.entries(rule)
		if (entries.length < 2) return false
		for (const [key, array] of entries) {
			switch (key) {
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

	return true
}

export function isConfigTranslationDirectory(
	translationDirectory: unknown,
): translationDirectory is ConfigTranslationDirectory {
	if (!isObject(translationDirectory)) return false
	for (const [key, name] of Object.entries(translationDirectory)) {
		if (key !== "main" && key !== "pages") return false
		if (typeof name !== "string") return false
	}

	return true
}

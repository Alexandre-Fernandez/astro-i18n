import { isObject, isStringArray } from "@lib/ts/guards"
import type {
	ConfigTranslations,
	DeepStringRecord,
} from "@src/core/state/types"

export function isConfigTranslations(
	configTranslations: unknown,
): configTranslations is ConfigTranslations {
	if (!isObject(configTranslations)) return false

	for (const [key, value] of Object.entries(configTranslations)) {
		// is loader array:
		if (key === "$load") {
			if (!Array.isArray(value)) return false
			for (const loader of value) {
				if (!isObject(loader)) return false
				const entries = Object.entries(loader)
				if (entries.length < 2) return false
				for (const [loaderKey, array] of entries) {
					switch (loaderKey) {
						case "namespaces": {
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
		if (key === "$directory") {
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

function isDeepStringRecord(
	deepStringRecord: unknown,
	root = true,
): deepStringRecord is DeepStringRecord {
	if (root) {
		// Record<string, string | self>
		if (!isObject(deepStringRecord)) return false
		for (const value of Object.values(deepStringRecord)) {
			if (!isDeepStringRecord(value, false)) return false
		}
		return true
	}
	// string | Record<string, self>
	if (typeof deepStringRecord === "string") return true
	if (!isObject(deepStringRecord)) return false
	for (const value of Object.values(deepStringRecord)) {
		if (!isDeepStringRecord(value, false)) return false
	}
	return true
}

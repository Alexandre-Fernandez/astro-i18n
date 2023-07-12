import { isStringArray } from "@lib/ts/guards"
import type {
	ConfigTranslations,
	DeepStringRecord,
} from "@src/core/state/types"

export function isConfigTranslations(
	configTranslations: unknown,
): configTranslations is ConfigTranslations {
	if (!configTranslations || typeof configTranslations !== "object") {
		return false
	}

	for (const [key, value] of Object.entries(configTranslations)) {
		// is loader array:
		if (key === "$load") {
			if (!Array.isArray(value)) return false
			for (const loader of value) {
				if (!loader || typeof loader !== "object") return false
				for (const [loaderKey, array] of Object.entries(loader)) {
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
		// is translations:
		if (!value || typeof value !== "object") return false
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
		if (deepStringRecord == null) return false
		if (typeof deepStringRecord !== "object") return false
		for (const value of Object.values(deepStringRecord)) {
			if (!isDeepStringRecord(value, false)) return false
		}
		return true
	}
	// string | Record<string, self>
	if (typeof deepStringRecord === "string") return true
	if (!deepStringRecord || typeof deepStringRecord !== "object") return false
	for (const value of Object.values(deepStringRecord)) {
		if (!isDeepStringRecord(value, false)) return false
	}
	return true
}

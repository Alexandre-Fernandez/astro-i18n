import { isObject, isStringArray } from "@lib/ts/guards"
import type { ConfigRoutes } from "@src/core/config/types"

export function isConfigRoutes(
	configRoutes: unknown,
): configRoutes is ConfigRoutes {
	if (!isObject(configRoutes)) return false

	for (const [key, value] of Object.entries(configRoutes)) {
		// is restricter array:
		if (key === "$restrict") {
			if (!Array.isArray(value)) return false
			for (const restricter of value) {
				if (!isObject(restricter)) return false
				const entries = Object.entries(restricter)
				if (entries.length < 2) return false
				for (const [restricterKey, array] of entries) {
					switch (restricterKey) {
						case "segments": {
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
		// is route translations:
		if (!isObject(value)) return false
		for (const routes of Object.values(value)) {
			if (typeof routes !== "string") return false
		}
	}

	return true
}

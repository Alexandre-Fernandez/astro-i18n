import { isObject } from "@lib/ts/guards"
import type { ConfigRoutes } from "@src/core/config/types"

export function isConfigRoutes(
	configRoutes: unknown,
): configRoutes is ConfigRoutes {
	if (!isObject(configRoutes)) return false

	for (const value of Object.values(configRoutes)) {
		if (!isObject(value)) return false
		for (const routes of Object.values(value)) {
			if (typeof routes !== "string") return false
		}
	}

	return true
}

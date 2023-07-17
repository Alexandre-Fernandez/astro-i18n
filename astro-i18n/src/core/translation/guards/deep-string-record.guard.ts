import { isObject } from "@lib/ts/guards"
import type { DeepStringRecord } from "@src/core/translation/types"

export function isDeepStringRecord(
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

import { isObject, isStringArray } from "@lib/ts/guards"
import type { SerializedFormatters } from "@src/core/translation/types"

export function isSerializedFormatters(
	serializedFormatters: unknown,
): serializedFormatters is SerializedFormatters {
	if (!isObject(serializedFormatters)) return false

	for (const serializedFormatter of Object.values(serializedFormatters)) {
		if (!isObject(serializedFormatter)) return false

		const entries = Object.entries(serializedFormatter)
		if (entries.length < 2) return false

		for (const [key, value] of entries) {
			switch (key) {
				case "args": {
					if (!isStringArray(value)) return false
					break
				}
				case "body": {
					if (typeof value !== "string") return false
					break
				}
				default: {
					break
				}
			}
		}
	}

	return true
}

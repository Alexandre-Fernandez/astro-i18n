import { isObjectLiteral } from "$lib/typescript-helpers/guards"
import type { ObjectEntry } from "../types/internal"

export function objectEntries<Obj extends Record<PropertyKey, unknown>>(
	object: Obj,
) {
	return Object.entries(object) as ObjectEntry<Obj>[]
}

/**
 * @returns The typescript `variable` type as a string. e.g. `["foo", 1]`
 * => `"(string | number)[]"`
 */
export function tsTypeof(variable: unknown) {
	const type = typeof variable
	if (type === "bigint") return "number"
	if (type === "function") return "(...args: unknown[]) => unknown"
	if (type !== "object") return type
	if (!variable) return "null"

	if (Array.isArray(variable)) {
		if (variable.length === 0) return "unknown[]"
		const types: Set<string> = new Set<string>(
			variable.map((item) => tsTypeof(item)),
		)
		return `(${[...types].join(" | ")})[]`
	}

	if (isObjectLiteral(variable)) {
		const props: string[] = Object.entries(variable).map(
			([key, value]) => `"${key}": ${tsTypeof(value)}`,
		)
		if (props.length === 0) return "Record<string, unknown>"
		return `{ ${props.join(", ")} }`
	}

	return "unknown"
}

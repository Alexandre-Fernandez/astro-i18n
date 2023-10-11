import type { Primitive } from "@src/core/translation/types"

export function isPrimitive(primitive: unknown): primitive is Primitive {
	return (
		primitive === null ||
		typeof primitive === "undefined" ||
		typeof primitive === "boolean" ||
		typeof primitive === "number" ||
		typeof primitive === "string"
	)
}

export function isPrimitiveArray(
	primitives: unknown,
): primitives is Primitive[] {
	if (!Array.isArray(primitives)) return false
	return primitives.every((primitive) => isPrimitive(primitive))
}

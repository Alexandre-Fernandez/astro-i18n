import type { Primitive } from "@src/core/parsing/types"

export function isPrimitive(primitive: unknown): primitive is Primitive {
	return (
		primitive === undefined ||
		primitive === null ||
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

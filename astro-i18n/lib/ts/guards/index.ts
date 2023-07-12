export function assertGuard<T>(
	value: unknown,
	guard: (value: unknown) => value is T,
	type?: string,
): asserts value is T {
	if (!guard(value)) {
		throw new TypeError(
			type
				? `"${value}" is not of type ${type}.`
				: `"${value}" is not the expected type.`,
		)
	}
}

export function isStringArray(array: unknown): array is string[] {
	return (
		Array.isArray(array) && array.every((item) => typeof item === "string")
	)
}

export function assertGuard<T>(
	value: unknown,
	guard: (value: unknown) => value is T,
	expectedType?: string,
): asserts value is T {
	if (!guard(value)) {
		let valueAsString = ""

		if (value) {
			if (typeof value === "object") {
				valueAsString = `\n${value.constructor.name}\n${JSON.stringify(
					value,
					null,
					4,
				)}`
			} else if (typeof value === "symbol") {
				valueAsString = `Symbol("${value.description}")`
			} else {
				valueAsString =
					typeof value === "string" ? `"${value}"` : `${value}`
			}
		} else {
			valueAsString = `${value}`
		}

		throw new TypeError(
			expectedType
				? `Unexpected type (expecting \`${expectedType}\`), found: ${valueAsString}`
				: `Unexpected type, found: ${valueAsString}`,
		)
	}
}

export function isStringArray(array: unknown): array is string[] {
	return (
		Array.isArray(array) && array.every((item) => typeof item === "string")
	)
}

export function assert<T>(
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

		if (!expectedType && guard.name.startsWith("is")) {
			expectedType = guard.name.slice(2)
		}

		throw new TypeError(
			expectedType
				? `Unexpected type (expecting \`${expectedType}\`), found: ${valueAsString}`
				: `Unexpected type, found: ${valueAsString}`,
		)
	}
}

export function isNumber(number: unknown): number is number {
	return typeof number === "number" && !Number.isNaN(number)
}

export function isDate(date: unknown): date is Date {
	return date instanceof Date && !Number.isNaN(date.getTime())
}

export function isArray(array: unknown): array is unknown[] {
	return Array.isArray(array)
}

export function isStringArray(array: unknown): array is string[] {
	return isArray(array) && array.every((item) => typeof item === "string")
}

export function isObject(object: unknown): object is object {
	return !!object && typeof object === "object"
}

export function isRecord(record: unknown): record is Record<string, unknown> {
	if (!isObject(record)) return false
	return Object.getPrototypeOf(record) === Object.prototype
}

export function isStringRecord(
	record: unknown,
): record is Record<string, string> {
	if (!isRecord(record)) return false
	for (const value of Object.values(record)) {
		if (typeof value !== "string") return false
	}
	return true
}

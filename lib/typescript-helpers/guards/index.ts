export function isObjectLiteral(
	subject: unknown,
): subject is Record<PropertyKey, unknown> {
	return Object.getPrototypeOf(subject) === Object.prototype
}

export function isStringArray(subject: unknown): subject is string[] {
	return (
		Array.isArray(subject) &&
		subject.every((item) => typeof item === "string")
	)
}

export function isStringStringRecord(
	subject: unknown,
): subject is Record<string, string> {
	if (!isObjectLiteral(subject)) return false
	for (const value of Object.values(subject)) {
		if (typeof value !== "string") return false
	}
	return true
}

export function assertIsStringStringRecord(
	subject: unknown,
): asserts subject is Record<string, string> {
	if (!isObjectLiteral(subject)) {
		throw new Error(`"${subject}" is not of type Record<string, string>.`)
	}

	for (const value of Object.values(subject)) {
		if (typeof value !== "string") {
			throw new TypeError(`"${value}" is not of type string.`)
		}
	}
}

export function assertIsInArray<T>(
	array: T[],
	subject: unknown,
): asserts subject is T {
	if (!(array as any[]).includes(subject)) {
		throw new Error(`${subject} is not in [${array.join(", ")}].`)
	}
}

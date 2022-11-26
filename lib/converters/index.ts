export function toNumber(value: unknown) {
	if (typeof value === "number") return value

	if (typeof value === "string") {
		const number = Number.parseFloat(value)
		if (!Number.isNaN(number)) return number
	}

	return undefined
}

export function toDate(value: unknown) {
	const date =
		typeof value === "string" || typeof value === "number"
			? new Date(value)
			: value
	if (!(date instanceof Date)) return undefined
	if (Number.isNaN(date.getTime())) return undefined
	return date
}

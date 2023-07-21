class InvalidDate extends Error {
	constructor(value?: unknown) {
		super(value ? `Invalid date (${value}).` : "Invalid date.")
	}
}

export default InvalidDate

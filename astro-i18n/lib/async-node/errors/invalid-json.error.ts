class InvalidJson extends Error {
	constructor(path?: string) {
		super(
			path
				? `Invalid format, could not parse JSON (${path}).`
				: "Invalid format, could not parse JSON.",
		)
	}
}

export default InvalidJson

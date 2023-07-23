class InvalidEnvironment extends Error {
	constructor(message?: string) {
		super(
			message
				? `Invalid environment: ${message}`
				: "Invalid environment.",
		)
	}
}

export default InvalidEnvironment

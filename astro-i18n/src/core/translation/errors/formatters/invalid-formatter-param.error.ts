class InvalidFormatterParam extends TypeError {
	constructor(message?: string) {
		super(
			message
				? `Invalid formatter parameter: ${message}`
				: "Invalid formatter parameter.",
		)
	}
}

export default InvalidFormatterParam

class InvalidFormatterParam extends TypeError {
	constructor(message?: string) {
		super(
			`Invalid formatter parameter: ${message}` ||
				"Invalid formatter parameter.",
		)
	}
}

export default InvalidFormatterParam

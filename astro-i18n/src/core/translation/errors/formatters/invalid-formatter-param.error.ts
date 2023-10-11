class InvalidFormatterParam extends TypeError {
	constructor(message?: string, formatter?: string) {
		if (message) {
			super(
				formatter
					? `Invalid formatter (${formatter}) parameter: ${message}`
					: `Invalid formatter parameter: ${message}`,
			)
		} else {
			super(
				formatter
					? `Invalid formatter (${formatter}) parameter.`
					: "Invalid formatter parameter.",
			)
		}
	}
}

export default InvalidFormatterParam

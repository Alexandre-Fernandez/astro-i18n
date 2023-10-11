class InvalidFormatterValue extends TypeError {
	constructor(message?: string, formatter?: string) {
		if (message) {
			super(
				formatter
					? `Invalid formatter (${formatter}) value: ${message}`
					: `Invalid formatter value: ${message}`,
			)
		} else {
			super(
				formatter
					? `Invalid formatter (${formatter}) value.`
					: "Invalid formatter value.",
			)
		}
	}
}

export default InvalidFormatterValue

class InvalidFormatterValue extends TypeError {
	constructor(message?: string) {
		super(
			message
				? `Invalid formatter value: ${message}`
				: "Invalid formatter value.",
		)
	}
}

export default InvalidFormatterValue

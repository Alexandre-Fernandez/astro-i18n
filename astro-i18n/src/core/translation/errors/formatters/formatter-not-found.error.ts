class FormatterNotFound extends Error {
	constructor(name?: string) {
		super(
			name
				? `Formatter "${name}" was not found.`
				: "Formatter not found.",
		)
	}
}

export default FormatterNotFound

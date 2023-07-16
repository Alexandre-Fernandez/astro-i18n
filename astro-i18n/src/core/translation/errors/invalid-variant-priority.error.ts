class InvalidVariantPriority extends Error {
	constructor(value?: string) {
		super(
			value
				? `Variant priority must be of type number (found: (${value})).`
				: "Variant priority must be of type number.",
		)
	}
}

export default InvalidVariantPriority

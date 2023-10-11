class InvalidVariantPropertyKey extends Error {
	constructor(key?: string) {
		super(
			key
				? `Invalid variant property key (${key}), it must be a valid variable name.`
				: `Invalid variant property value, it must be a valid variable name.`,
		)
	}
}

export default InvalidVariantPropertyKey

class NonStringVariant extends Error {
	constructor() {
		super("Cannot use a variant on a key which value is not a string.")
	}
}

export default NonStringVariant

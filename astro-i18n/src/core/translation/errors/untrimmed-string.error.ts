class UntrimmedString extends Error {
	constructor(value = "") {
		super(
			value
				? `Cannot procces untrimmed value ("${value}").`
				: "Cannot procces untrimmed value",
		)
	}
}

export default UntrimmedString

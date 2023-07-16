class UnknownValue extends Error {
	constructor(value = "") {
		if (value) {
			const maxPreview = 20
			const preview = value.slice(0, maxPreview)
			if (preview.length === maxPreview) {
				value = `${preview.slice(0, maxPreview - 3)}...`
			}
		}

		super(
			value
				? `Cannot parse unknown value (${value}).`
				: "Cannot parse unknown value",
		)
	}
}

export default UnknownValue

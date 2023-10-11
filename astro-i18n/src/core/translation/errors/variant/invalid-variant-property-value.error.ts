const acceptedTypes =
	"undefined, null, number, string, boolean and flat arrays of these types."

class InvalidVariantPropertyValue extends Error {
	constructor(value?: string) {
		super(
			value
				? `Invalid variant property value (${value}), accepted types are: ${acceptedTypes}.`
				: `Invalid variant property value, accepted types are: ${acceptedTypes}.`,
		)
	}
}

export default InvalidVariantPropertyValue

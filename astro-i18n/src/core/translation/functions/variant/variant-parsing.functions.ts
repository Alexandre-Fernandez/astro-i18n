import { CALLBACK_BREAK } from "@src/constants/app.constants"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import { matchVariantValue } from "@src/core/translation/functions/variant/variant-matching.functions"
import { isPrimitive } from "@src/core/translation/guards/primitive.guard"
import InvalidVariantPropertyValue from "@src/core/translation/errors/variant/invalid-variant-property-value.error"

/**
 * Creates the variant's property value for the given `value`.
 * @param value for example: `"1.5"`.
 */
export function parseVariantValue(value: string, type: ValueType) {
	let parsed: unknown

	switch (type) {
		case ValueType.UNDEFINED: {
			parsed = undefined
			break
		}
		case ValueType.NULL: {
			parsed = null
			break
		}
		case ValueType.BOOLEAN: {
			if (value === "true") {
				parsed = true
				break
			}
			if (value === "false") {
				parsed = false
				break
			}
			// fallthrough (default case if not true or false)
		}
		case ValueType.NUMBER: {
			parsed = value.includes(".")
				? Number.parseFloat(value)
				: Number.parseInt(value, 10)
			break
		}
		case ValueType.STRING: {
			parsed = value.slice(1, -1)
			break
		}
		case ValueType.ARRAY: {
			parsed = parseArray(value)
			break
		}
		default: {
			throw new InvalidVariantPropertyValue(value)
		}
	}

	return parsed
}

/**
 * Creates the variant property of type array.
 */
function parseArray(array: string) {
	const parsed: unknown[] = []

	let value = ""
	depthAwareforEach(array, (char, _, depth, isOpening) => {
		if (depth === 0) {
			const { value: matchedValue, type } = matchVariantValue(
				value.trim(),
			)
			const parsedValue = parseVariantValue(matchedValue, type)
			if (!isPrimitive(parsedValue)) {
				throw new InvalidVariantPropertyValue(value)
			}
			parsed.push(parsedValue)
			return CALLBACK_BREAK
		}

		if (depth === 1) {
			if (isOpening) return null // ignore opening bracket
			if (char === ",") {
				const { value: matchedValue, type } = matchVariantValue(
					value.trim(),
				)
				parsed.push(parseVariantValue(matchedValue, type))
				value = ""
				return null
			}
		}

		value += char
		return null
	})

	return parsed
}

import { CALLBACK_BREAK } from "@src/constants/app.constants"
import Interpolation from "@src/core/translation/classes/interpolation.class"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import UnknownValue from "@src/core/translation/errors/interpolation/unknown-value.error"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import type {
	FormatterMatch,
	Formatters,
	TranslationProperties,
} from "@src/core/translation/types"

/**
 * Creates the interpolation value for the given `value`.
 * @param value for example: `"{ prop: interpolationValue }"`.
 */
export function parseInterpolationValue(
	value: string,
	alias: string | null,
	type: ValueType,
	formatters: FormatterMatch[],
	properties: TranslationProperties,
	availableFormatters: Formatters,
) {
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
		case ValueType.VARIABLE: {
			if (alias) {
				parsed = properties[alias]
				break
			}
			parsed = properties[value]
			break
		}
		case ValueType.STRING: {
			parsed = value.slice(1, -1)
			break
		}
		case ValueType.OBJECT: {
			parsed = parseObject(value, properties, availableFormatters)
			break
		}
		case ValueType.ARRAY: {
			parsed = parseArray(value, properties, availableFormatters)
			break
		}
		default: {
			throw new UnknownValue(value)
		}
	}

	// chain formatters
	for (const { name, args: rawArgs } of formatters) {
		const formatter = availableFormatters[name]
		if (!formatter) return undefined

		const args = rawArgs.map(
			(arg) =>
				new Interpolation(arg, properties, availableFormatters).value,
		)
		parsed = formatter(parsed, ...args)
	}

	return parsed
}

/**
 * Creates the interpolation value of type object.
 */
function parseObject(
	object: string,
	properties: TranslationProperties,
	availableFormatters: Formatters,
) {
	const parsed: Record<string, unknown> = {}

	let key = ""
	let value = ""
	let isKey = true
	depthAwareforEach(object, (char, _, depth, isOpening) => {
		if (depth === 0) {
			parsed[key] = new Interpolation(
				value,
				properties,
				availableFormatters,
			).value
			return CALLBACK_BREAK
		}

		if (depth === 1) {
			if (isKey) {
				if (isOpening) return null // ignore opening bracket
				if (/\s/.test(char)) return null
				if (char === ":") {
					isKey = false
					return null
				}
				key += char
			} else if (char === ",") {
				parsed[key] = new Interpolation(
					value,
					properties,
					availableFormatters,
				).value
				key = ""
				value = ""
				isKey = true
				return null
			}
		}

		if (!isKey) value += char
		return null
	})

	return parsed
}

/**
 * Creates the interpolation value of type array.
 */
function parseArray(
	array: string,
	properties: TranslationProperties,
	availableFormatters: Formatters,
) {
	const parsed: unknown[] = []

	let value = ""
	depthAwareforEach(array, (char, _, depth, isOpening) => {
		if (depth === 0) {
			parsed.push(
				new Interpolation(value, properties, availableFormatters).value,
			)
			return CALLBACK_BREAK
		}

		if (depth === 1) {
			if (isOpening) return null // ignore opening bracket
			if (char === ",") {
				parsed.push(
					new Interpolation(value, properties, availableFormatters)
						.value,
				)
				value = ""
				return null
			}
		}

		value += char
		return null
	})

	return parsed
}

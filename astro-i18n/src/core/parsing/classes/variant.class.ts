// original maps translation.key to array of variants

import { throwError } from "@lib/error"
import { CALLBACK_BREAK } from "@src/constants/app.constants"
import { ValueType } from "@src/core/parsing/enums/value-type.enum"
import InvalidVariantPriority from "@src/core/parsing/errors/invalid-variant-priority.error"
import InvalidVariantPropertyKey from "@src/core/parsing/errors/invalid-variant-property-key.error"
import InvalidVariantPropertyValue from "@src/core/parsing/errors/invalid-variant-property-value.error"
import UntrimmedString from "@src/core/parsing/errors/untrimmed-string.error"
import UnreachableCode from "@src/errors/unreachable-code.error"
import { depthAwareforEach } from "@src/core/parsing/functions/utility.functions"
import {
	isPrimitive,
	isPrimitiveArray,
} from "@src/core/parsing/guards/is-primitive.guard"
import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/parsing/functions/matching.functions"
import type { VariantProperty } from "@src/core/parsing/types"

class Variant {
	static priorityKey = "$priority"

	raw

	priority = 0

	properties: VariantProperty[] = []

	constructor(variant: string) {
		const trimmed = variant.trim()
		this.raw = trimmed

		let key = ""
		let value = ""
		let isKey = true
		depthAwareforEach(trimmed, (char, i, depth) => {
			const isLast = i === trimmed.length - 1

			if (isKey) {
				if (/\s/.test(char)) return null
				if (char === ":") {
					isKey = false
					return null
				}
				key += char
				return null
			}

			if (depth > 0) {
				// string or array
				value += char
				return null
			}

			if (isLast) value += char

			if (char === "," || isLast) {
				// key & value are filled, matching them...
				const matchedKey = matchVariable(key.trim())?.match[0]
				if (!matchedKey) throw new InvalidVariantPropertyKey(key)
				const { value: matchedValue, type } = Variant.#matchValue(
					value.trim(),
				)

				// checking for priority key
				if (matchedKey === Variant.priorityKey) {
					const priority = Variant.#parseValue(matchedValue, type)
					if (typeof priority !== "number") {
						throw new InvalidVariantPriority(matchedValue)
					}
					this.priority = priority
					return null
				}

				// parsing values
				const parsedValue = Variant.#parseValue(matchedValue, type)
				const values: unknown[] = Array.isArray(parsedValue)
					? parsedValue
					: [parsedValue]

				if (!isPrimitiveArray(values)) {
					throw new InvalidVariantPropertyValue(value)
				}

				this.properties.push({
					name: matchedKey,
					values,
				})

				key = ""
				value = ""
				isKey = true
				return null
			}

			value += char
			return null
		})
	}

	/**
	 * Creates the variant's property value for the given `value`.
	 * @param value for example: `"1.5"`.
	 */
	static #parseValue(value: string, type: ValueType) {
		let parsed: unknown

		switch (type) {
			case ValueType.Undefined: {
				parsed = undefined
				break
			}
			case ValueType.Null: {
				parsed = null
				break
			}
			// @ts-expect-error
			case ValueType.Boolean: {
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
			case ValueType.Number: {
				parsed = value.includes(".")
					? Number.parseFloat(value)
					: Number.parseInt(value, 10)
				break
			}
			case ValueType.String: {
				parsed = value.slice(1, -1)
				break
			}
			case ValueType.Array: {
				parsed = this.#parseArray(value)
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
	static #parseArray(array: string) {
		const parsed: unknown[] = []

		let value = ""
		depthAwareforEach(array, (char, _, depth, isOpening) => {
			if (depth === 0) {
				const { value: matchedValue, type } = this.#matchValue(
					value.trim(),
				)
				const parsedValue = this.#parseValue(matchedValue, type)
				if (!isPrimitive(parsedValue)) {
					throw new InvalidVariantPropertyValue(value)
				}
				parsed.push(parsedValue)
				return CALLBACK_BREAK
			}

			if (depth === 1) {
				if (isOpening) return null // ignore opening bracket
				if (char === ",") {
					const { value: matchedValue, type } = this.#matchValue(
						value.trim(),
					)
					parsed.push(this.#parseValue(matchedValue, type))
					value = ""
					return null
				}
			}

			value += char
			return null
		})

		return parsed
	}

	/**
	 * Matches a variant's property value.
	 * @param value for example `"string_value"`
	 */
	static #matchValue(value: string) {
		if (/^\s/.test(value)) throw new UntrimmedString(value)

		let matched = matchUndefined(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.Undefined,
				end: matched.range[1],
			}
		}

		matched = matchNull(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.Null,
				end: matched.range[1],
			}
		}

		matched = matchBoolean(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.Boolean,
				end: matched.range[1],
			}
		}

		matched = matchNumber(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.Number,
				end: matched.range[1],
			}
		}

		matched = matchString(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.String,
				end: matched.range[1],
			}
		}

		matched = matchArray(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: ValueType.Array,
				end: matched.range[1],
			}
		}

		throw new InvalidVariantPropertyValue(value)
	}
}

export default Variant

const a = new Variant(
	" string: 'string_prop', numbers: [0, 1, 2], mixed: ['str', 3], $priority: 5",
)

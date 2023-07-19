import { throwFalsy } from "@lib/error"
import { CALLBACK_BREAK } from "@src/constants/app.constants"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import InvalidVariantPriority from "@src/core/translation/errors/invalid-variant-priority.error"
import InvalidVariantPropertyKey from "@src/core/translation/errors/invalid-variant-property-key.error"
import InvalidVariantPropertyValue from "@src/core/translation/errors/invalid-variant-property-value.error"
import UntrimmedString from "@src/core/translation/errors/untrimmed-string.error"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import {
	isPrimitive,
	isPrimitiveArray,
} from "@src/core/translation/guards/primitive.guard"
import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/translation/functions/matching.functions"
import type { VariantProperty } from "@src/core/translation/types"

class Variant {
	static priorityKey = "$priority"

	raw

	priority = 0

	properties: VariantProperty[] = []

	value: string

	constructor(variant: string, value: string) {
		this.value = value // translation value

		const trimmed = variant.trim()
		this.raw = trimmed

		// checking properties
		let propKey = ""
		let propValue = ""
		let isKey = true
		depthAwareforEach(trimmed, (char, i, depth) => {
			const isLast = i === trimmed.length - 1

			if (isKey) {
				if (/\s/.test(char)) return null
				if (char === ":") {
					isKey = false
					return null
				}
				propKey += char
				return null
			}

			if (depth > 0) {
				// string or array
				propValue += char
				return null
			}

			if (isLast) propValue += char

			if (char === "," || isLast) {
				// key & value are filled, matching them...
				const matchedKey = matchVariable(propKey.trim())?.match[0]
				if (!matchedKey) throw new InvalidVariantPropertyKey(propKey)
				const { value: matchedValue, type } = Variant.#matchValue(
					propValue.trim(),
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
					throw new InvalidVariantPropertyValue(propValue)
				}

				this.properties.push({
					name: matchedKey,
					values,
				})

				propKey = ""
				propValue = ""
				isKey = true
				return null
			}

			propValue += char
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
				value: matched.match[0] || throwFalsy(),
				type: ValueType.UNDEFINED,
				end: matched.range[1],
			}
		}

		matched = matchNull(value)
		if (matched) {
			return {
				value: matched.match[0] || throwFalsy(),
				type: ValueType.NULL,
				end: matched.range[1],
			}
		}

		matched = matchBoolean(value)
		if (matched) {
			return {
				value: matched.match[0] || throwFalsy(),
				type: ValueType.BOOLEAN,
				end: matched.range[1],
			}
		}

		matched = matchNumber(value)
		if (matched) {
			return {
				value: matched.match[0] || throwFalsy(),
				type: ValueType.NUMBER,
				end: matched.range[1],
			}
		}

		matched = matchString(value)
		if (matched) {
			return {
				value: matched.match[0] || throwFalsy(),
				type: ValueType.STRING,
				end: matched.range[1],
			}
		}

		matched = matchArray(value)
		if (matched) {
			return {
				value: matched.match[0] || throwFalsy(),
				type: ValueType.ARRAY,
				end: matched.range[1],
			}
		}

		throw new InvalidVariantPropertyValue(value)
	}

	/**
	 * Calculates the matching score for the given properties.
	 */
	calculateMatchingScore(properties: Record<string, unknown>) {
		let score = 0

		for (const { name, values } of this.properties) {
			if (!Object.hasOwn(properties, name)) continue
			const property = properties[name]

			const valueScores: number[] = []
			for (const value of values) {
				if (typeof property === "number" && typeof value === "number") {
					const difference = property - value
					if (difference === 0) {
						valueScores.push(1000)
						continue
					}

					// we remove 1 because `difference === 1` would give same score as `difference === 0`
					valueScores.push(Math.abs(1000 / difference) - 1)
					continue
				}
				if (property === value) {
					valueScores.push(1000)
				}
			}
			if (valueScores.length === 0) continue

			score += Math.max(...valueScores)
		}

		return score + this.priority
	}
}

export default Variant

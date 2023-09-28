import InvalidVariantPriority from "@src/core/translation/errors/variant/invalid-variant-priority.error"
import InvalidVariantPropertyKey from "@src/core/translation/errors/variant/invalid-variant-property-key.error"
import InvalidVariantPropertyValue from "@src/core/translation/errors/variant/invalid-variant-property-value.error"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import { matchVariable } from "@src/core/translation/functions/matching.functions"
import { matchVariantValue } from "@src/core/translation/functions/variant/variant-matching.functions"
import { isPrimitiveArray } from "@src/core/translation/guards/primitive.guard"
import { parseVariantValue } from "@src/core/translation/functions/variant/variant-parsing.functions"
import { VARIANT_PRIORITY_KEY } from "@src/core/translation/constants/variant.constants"
import type {
	TranslationProperties,
	VariantProperties,
	VariantProperty,
} from "@src/core/translation/types"

class Variant {
	raw

	priority

	properties: VariantProperty[]

	value

	constructor({ raw, priority, properties, value }: VariantProperties = {}) {
		this.raw = raw || ""
		this.priority = priority || 0
		this.properties = properties || []
		this.value = value || ""
	}

	/**
	 * @param variant The variant part of the translation, for example for a
	 * variant string `"{{ prop1: true }}"` only `"prop1: true"` should be
	 * passed.
	 * @param value The translation value, this will only be stored for later
	 * retrieval.
	 */
	static fromString(variant: string, value: string) {
		const translationVariant = new Variant()

		translationVariant.value = value

		const trimmed = variant.trim()
		translationVariant.raw = trimmed

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
				const { value: matchedValue, type } = matchVariantValue(
					propValue.trim(),
				)

				// checking for priority key
				if (matchedKey === VARIANT_PRIORITY_KEY) {
					const priority = parseVariantValue(matchedValue, type)
					if (typeof priority !== "number") {
						throw new InvalidVariantPriority(matchedValue)
					}
					translationVariant.priority = priority * 0.001
					return null
				}

				// parsing values
				const parsedValue = parseVariantValue(matchedValue, type)
				const values: unknown[] = Array.isArray(parsedValue)
					? parsedValue
					: [parsedValue]

				if (!isPrimitiveArray(values)) {
					throw new InvalidVariantPropertyValue(propValue)
				}

				translationVariant.properties.push({
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

		return translationVariant
	}

	/**
	 * Calculates the variant's matching score for the given properties.
	 */
	calculateMatchingScore(properties: TranslationProperties) {
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

		// priority only applies on matches
		return score > 0 ? score + this.priority : score
	}
}

export default Variant

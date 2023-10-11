import { matchInterpolation } from "@src/core/translation/functions/interpolation/interpolation-matching.functions"
import { parseInterpolationValue } from "@src/core/translation/functions/interpolation/interpolation-parsing.functions"
import type {
	TranslationProperties,
	Formatters,
} from "@src/core/translation/types"

/**
 * A translation interpolation.
 * It has 3 main parts, the value, the alias and the formatters. For example:
 * `"{# value(alias)>formatter #}"`, here the value would be a variable that
 * would get its value from the `"alias"` property in the user-provided
 * properties.
 * Interpolation can also be used as values, for example every value in an
 * object can be parsed as an interpolation, this allows for all values to be
 * variables, have formatters, aliases, etc...
 */
class Interpolation {
	raw: string

	value: unknown

	alias: string | null = null

	/**
	 * @param interpolation A translation interpolation, for example for an
	 * interpolation string such as `"{# prop1(alias)>formatter #}"` only
	 * `"prop1(alias)>formatter"` should be passed.
	 */
	constructor(
		interpolation: string,
		properties: TranslationProperties,
		availableFormatters: Formatters,
	) {
		const { raw, value, type, alias, formatters } =
			matchInterpolation(interpolation)

		this.raw = raw

		this.alias = alias

		this.value = parseInterpolationValue(
			value,
			alias,
			type,
			formatters,
			properties,
			availableFormatters,
		)
	}
}

export default Interpolation

import { matchInterpolation } from "@src/core/translation/functions/interpolation/interpolation-matching.functions"
import { parseInterpolationValue } from "@src/core/translation/functions/interpolation/interpolation-parsing.functions"
import type {
	TranslationProperties,
	Formatters,
} from "@src/core/translation/types"

class Interpolation {
	raw: string

	value: unknown

	alias: string | null = null

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

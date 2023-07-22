import { throwFalsy } from "@lib/error"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import UntrimmedString from "@src/core/translation/errors/untrimmed-string.error"
import InvalidVariantPropertyValue from "@src/core/translation/errors/variant/invalid-variant-property-value.error"
import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchString,
	matchUndefined,
} from "@src/core/translation/functions/matching.functions"

/**
 * Matches a variant's property value.
 * @param value for example `"string_value"`
 */
export function matchVariantValue(value: string) {
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

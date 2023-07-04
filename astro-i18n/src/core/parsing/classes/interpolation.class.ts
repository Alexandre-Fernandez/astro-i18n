import { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"
import UnknownValue from "@src/core/parsing/errors/unknown-value.error"
import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchObject,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/parsing/functions/matching.functions"
import type {
	InterpolationValue,
	InterpolationFormatter,
	RawInterpolationValue,
} from "@src/core/parsing/types"

class Interpolation {
	/**
	 * For `"{# myvar(somename) #}"` or `"{# 'text'(somename) #}"`, `alias`
	 * will be equal to `"somename"`.
	 */
	alias: string | null = null

	/**
	 * For `"{# { prop: nestedvar }(alias) #}"`, `value` will be equal to
	 * `{ get: ({ nestedvar }) => ({ prop: nestedvar }), vars: ["nestedvar"] }`.
	 */
	value: InterpolationValue = {
		raw: "undefined",
		type: InterpolationValueType.Undefined,
		get: () => undefined,
	}

	/**
	 * For `"{# val>timify('Europe/Andorra'(tz), true)>uppercase #}"`,
	 * `formatters` will be equal to `[{ name: "timify", arguments: [{ var:
	 * null, alias: "tz", value: { get: () => "Europe/Andorra", vars: [] } },
	 * { var: null, alias: null, value: { get: () => true, vars: [] } }] }]`.
	 */
	formatters: InterpolationFormatter[] = []

	constructor(interpolation: string) {
		const trimmed = interpolation.trim()
	}

	setAlias(alias: string | null) {
		this.alias = alias
		return this
	}

	setValue(value: InterpolationValue) {
		this.value = value
		return this
	}

	setFormatters(formatters: InterpolationFormatter[]) {
		this.formatters = formatters
		return this
	}

	#parseInterpolation(trimmedInterpolation: string) {
		const rawValue = this.#parseRawValue(trimmedInterpolation)
		// when parsing objects/arrays every new value is an interpolation
	}

	/**
	 * Separates the interpolation value string from `raw` and determines its
	 * type.
	 */
	#parseRawValue(raw: string): RawInterpolationValue {
		let matched = matchUndefined(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Undefined,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchNull(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Null,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchBoolean(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Boolean,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchNumber(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Number,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchVariable(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Variable,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchString(raw)
		if (matched) {
			return {
				type: InterpolationValueType.String,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchObject(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Object,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		matched = matchArray(raw)
		if (matched) {
			return {
				type: InterpolationValueType.Array,
				value: matched.match[0] || "💥",
				end: matched.range[1],
			}
		}

		throw new UnknownValue(raw)
	}
}

// {# {var: nested}(value)>formatter1({}(args))>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}) #}

export default Interpolation

/*

const val = {
	name: null,
	alias: "value",
	default: {
		getter: ({ nested }: Record<string, any>) => ({ var: nested }),
		variables: ["nested"],
	},
	formatters: [
		{
			name: "formatter1",
			arguments: [
				{
					name: null,
					alias: "args",
					default: {
						getter: () => ({}),
						variables: [],
					},
					formatters: [],
				},
				{
					name: null,
					alias: null,
					default: {
						getter: () => "some value",
						variables: [],
					},
					formatters: [],
				},
			],
		},
	],
}

*/

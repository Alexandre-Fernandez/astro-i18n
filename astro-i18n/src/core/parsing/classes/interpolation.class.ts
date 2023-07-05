import { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"
import UnknownValue from "@src/core/parsing/errors/unknown-value.error"
import { matchInterpolationValue } from "@src/core/parsing/functions/matching.functions"
import type { InterpolationFormatter, Formatter } from "@src/core/parsing/types"

class Interpolation {
	/**
	 * The original interpolation string (trimmed).
	 */
	raw: string

	/**
	 * For `"{# { prop: nestedvar }(alias) #}"`, `value` will be equal to
	 * `({ nestedvar }) => ({ prop: nestedvar })`.
	 */
	value: (
		options: Record<string, any>,
		formatters: Record<string, Formatter>,
	) => unknown

	/**
	 * For `"{# myvar(somename) #}"` or `"{# 'text'(somename) #}"`, `alias`
	 * will be equal to `"somename"`.
	 */
	alias: string | null = null

	/**
	 * For `"{# val>timify('Europe/Andorra'(tz), true)>uppercase #}"`,
	 * `formatters` will be equal to `[{ name: "timify", arguments: [{ var:
	 * null, alias: "tz", value: { get: () => "Europe/Andorra", vars: [] } },
	 * { var: null, alias: null, value: { get: () => true, vars: [] } }] }]`.
	 */
	formatters: InterpolationFormatter[] = []

	constructor(interpolation: string) {
		let current = interpolation.trim()

		this.raw = current

		const { value, type, end } = matchInterpolationValue(current)

		switch (type) {
			case InterpolationValueType.Undefined: {
				this.value = () => undefined
				break
			}
			case InterpolationValueType.Null: {
				this.value = () => null
				break
			}
			// @ts-expect-error
			case InterpolationValueType.Boolean: {
				if (value === "true") {
					this.value = () => true
					break
				}
				if (value === "false") {
					this.value = () => false
					break
				}
				// fallthrough
			}
			case InterpolationValueType.Number: {
				this.value = () =>
					value.includes(".")
						? Number.parseFloat(value)
						: Number.parseInt(value, 10)
				break
			}
			case InterpolationValueType.Variable: {
				this.value = (props) => props[value]
				break
			}
			case InterpolationValueType.String: {
				this.value = () => value.slice(1, -1)
				break
			}
			case InterpolationValueType.Object: {
				this.value = () => ({}) // parse object (every prop value = interpolation)
				break
			}
			case InterpolationValueType.Array: {
				this.value = () => [] // parse array (every prop value = interpolation)
				break
			}
			default: {
				throw new UnknownValue(value)
			}
		}

		current = current.slice(end) // slice processed value off
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

import type {
	InterpolationValue,
	InterpolationFormatter,
} from "@src/core/parsing/types"

class Interpolation {
	/**
	 * For `"{# myvar #}"`, `var` will be equal to `"myvar"`, for
	 * `"{# 'text'(alias) #}"` it will be equal to `null`.
	 */
	var: string | null = null

	/**
	 * For `"{# myvar(somename) #}"` or `"{# 'text'(somename) #}"`, `alias`
	 * will be equal to `"somename"`.
	 */
	alias: string | null = null

	/**
	 * For `"{# { prop: nestedvar }(alias) #}"`, `value` will be equal to
	 * `{ get: ({ nestedvar }) => ({ prop: nestedvar }), vars: ["nestedvar"] }`.
	 * If `var` is not `null`, `value` will be null.
	 */
	value: InterpolationValue = null

	/**
	 * For `"{# val>timify('Europe/Andorra'(tz), true)>uppercase #}"`,
	 * `formatters` will be equal to `[{ name: "timify", arguments: [{ var:
	 * null, alias: "tz", value: { get: () => "Europe/Andorra", vars: [] } },
	 * { var: null, alias: null, value: { get: () => true, vars: [] } }] }]`.
	 */
	formatters: InterpolationFormatter[] = []
}

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

import { RegexBuilder } from "@lib/regex"
import {
	NUMBER_PATTERN,
	VARNAME_PATTERN,
} from "@src/constants/patterns.constants"
import type { Matcher } from "@src/core/parsing/types"

export const matchVariable: Matcher = RegexBuilder.fromRegex(VARNAME_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()

export const matchNumber: Matcher = RegexBuilder.fromRegex(NUMBER_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()

export function matchString(string: string): ReturnType<Matcher> {
	const quoteType = string[0]
	if (quoteType !== '"' && quoteType !== "'") return null

	let end = string.slice(1).indexOf(quoteType)
	if (end === -1) return null
	end += 2 // adding first char back + last char

	return {
		range: [0, end],
		match: [string.slice(0, end)],
	}
}

export function matchBoolean(string: string): ReturnType<Matcher> {
	if (string.startsWith("true")) {
		return {
			range: [0, 4],
			match: ["true"],
		}
	}

	if (string.startsWith("false")) {
		return {
			range: [0, 5],
			match: ["true"],
		}
	}

	return null
}

export function matchUndefined(string: string): ReturnType<Matcher> {
	if (string.startsWith("undefined")) {
		return {
			range: [0, 9],
			match: ["undefined"],
		}
	}

	return null
}

export function matchNull(string: string): ReturnType<Matcher> {
	if (string.startsWith("null")) {
		return {
			range: [0, 4],
			match: ["null"],
		}
	}

	return null
}

export function matchObject(string: string): ReturnType<Matcher> {
	if (!string.startsWith("{")) return null

	let depth = 0
	for (let i = 0; i < string.length; i += 1) {
		const char = string[i]

		if (char === "{") depth += 1
		else if (char === "}") depth -= 1

		if (depth === 0) {
			const end = i + 1
			return {
				range: [0, end],
				match: [string.slice(0, end)],
			}
		}
	}

	return null
}

export function matchArray(string: string) {
	if (!string.startsWith("[")) return null

	let depth = 0
	for (let i = 0; i < string.length; i += 1) {
		const char = string[i]

		if (char === "[") depth += 1
		else if (char === "]") depth -= 1

		if (depth === 0) {
			const end = i + 1
			return {
				range: [0, end],
				match: [string.slice(0, end)],
			}
		}
	}

	return null
}

const val = {
	name: undefined,
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
					name: undefined,
					alias: "args",
					default: {
						getter: () => ({}),
						variables: [],
					},
					formatters: [],
				},
			],
		},
	],
}

// {# {var: nested}(value)>formatter1({}(args))>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}) #}

// {# { prop: { val1: nestedVariable, val2: 1 }(value)>formatter1(args:{}) #}

//

//

//

// const a = [
// 	{
// 		a: [0, 2, 3],
// 		b: "ezazea",
// 	},
// 	8,
// 	[{ xd: "lol" }],
// ]

// {#value>formatter1(args:{})>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}):'default value'#}
// value>formatter1(args:{})>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}):'default value'

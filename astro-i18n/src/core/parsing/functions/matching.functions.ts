import { RegexBuilder } from "@lib/regex"
import {
	NUMBER_PATTERN,
	VARNAME_PATTERN,
} from "@src/constants/patterns.constants"
import { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"
import UntrimmedString from "@src/core/parsing/errors/untrimmed-string.error"
import UnknownValue from "@src/core/parsing/errors/unknown-value.error"
import type { InterpolationValueMatch, Matcher } from "@src/core/parsing/types"

// match interpolation

export function matchInterpolationValue(
	interpolation: string,
): InterpolationValueMatch {
	if (/^\s/.test(interpolation)) throw new UntrimmedString(interpolation)

	let matched = matchUndefined(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Undefined,
			end: matched.range[1],
		}
	}

	matched = matchNull(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Null,
			end: matched.range[1],
		}
	}

	matched = matchBoolean(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Boolean,
			end: matched.range[1],
		}
	}

	matched = matchNumber(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Number,
			end: matched.range[1],
		}
	}

	matched = matchVariable(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Variable,
			end: matched.range[1],
		}
	}

	matched = matchString(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.String,
			end: matched.range[1],
		}
	}

	matched = matchObject(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Object,
			end: matched.range[1],
		}
	}

	matched = matchArray(interpolation)
	if (matched) {
		return {
			value: matched.match[0] || "💥",
			type: InterpolationValueType.Array,
			end: matched.range[1],
		}
	}

	throw new UnknownValue(interpolation)
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
			match: ["false"],
		}
	}

	return null
}

const numberMatcher: Matcher = RegexBuilder.fromRegex(NUMBER_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()
export function matchNumber(string: string) {
	return numberMatcher(string)
}

const variableMatcher: Matcher = RegexBuilder.fromRegex(VARNAME_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()
export function matchVariable(string: string) {
	return variableMatcher(string)
}

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

export function matchArray(string: string): ReturnType<Matcher> {
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

// {# {var: nested}(value)>formatter1({}(args))>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}) #}

// {# { prop: { val1: nestedVariable, val2: 1 }(value)>formatter1(args:{}) #}

/*
const demo = "{ prop: 'my_value', prop2: { nested: 1, num: 2, deep: { done: true } } }"

function parseObjectValue(value: string) {
    const result = {}
 
    let depth = 0
    let isKey = true
    let key = ""
    for(let i = 0; i < value.length; i +=1 ) {
        const char = value[i]

        if (char === "{") {
            depth += 1
            continue
        }
		if (char === "}") {
            depth -= 1
            continue
        }
        if(char === ":" && isKey) {
            isKey = false
            continue
        } 
        if(depth > 1) continue
        if(/\s/.test(char)) continue

        if(isKey) {
            key += char
            console.log(key)
            continue
        }

    }
}
*/

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

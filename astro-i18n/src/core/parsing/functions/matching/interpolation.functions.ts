import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchObject,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/parsing/functions/matching/primitives.functions"
import UnknownValue from "@src/core/parsing/errors/unknown-value.error"
import UntrimmedString from "@src/core/parsing/errors/untrimmed-string.error"
import { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"
import type { InterpolationValueMatch, Matcher } from "@src/core/parsing/types"
import { RegexBuilder } from "@lib/regex"
import { INTERPOLATION_ALIAS_PATTERN } from "@src/constants/patterns.constants"
import UnreachableCode from "@src/errors/unreachable-code.error"

const interpolationAliasMatcher: Matcher = RegexBuilder.fromRegex(
	INTERPOLATION_ALIAS_PATTERN,
)
	.assertStarting()
	.build()
	.toMatcher()

export function matchInterpolation(interpolation: string) {
	interpolation = interpolation.trim()

	const result = {
		raw: interpolation,
		value: null as Omit<InterpolationValueMatch, "end"> | null,
		alias: null as string | null,
		formatters: [] as { name: string; arguments: string[] }[],
	}

	const { end, ...value } = matchInterpolationValue(interpolation)
	result.value = value

	interpolation = interpolation.slice(end).trim()

	const aliasMatch = matchInterpolationAlias(interpolation)
	if (aliasMatch) {
		const { match, range } = aliasMatch
		result.alias =
			match[1] || new UnreachableCode(matchInterpolation.name).message
		interpolation = interpolation.slice(range[1]).trim()
	}

	console.log("--------------------")
	console.log(result)
	console.log(interpolation)

	// formatters need custom parsing (maybe regex assisted) regex only is not enough
}

matchInterpolation(
	"  { test: myvar }  (   myalias  )   >formatter1()>formatter2('xd')         ",
)

export function matchInterpolationValue(
	interpolation: string,
): InterpolationValueMatch {
	if (/^\s/.test(interpolation)) throw new UntrimmedString(interpolation)

	let matched = matchUndefined(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Undefined,
			end: matched.range[1],
		}
	}

	matched = matchNull(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Null,
			end: matched.range[1],
		}
	}

	matched = matchBoolean(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Boolean,
			end: matched.range[1],
		}
	}

	matched = matchNumber(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Number,
			end: matched.range[1],
		}
	}

	matched = matchVariable(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Variable,
			end: matched.range[1],
		}
	}

	matched = matchString(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.String,
			end: matched.range[1],
		}
	}

	matched = matchObject(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Object,
			end: matched.range[1],
		}
	}

	matched = matchArray(interpolation)
	if (matched) {
		return {
			value:
				matched.match[0] ||
				new UnreachableCode(matchInterpolationValue.name).message,
			type: InterpolationValueType.Array,
			end: matched.range[1],
		}
	}

	throw new UnknownValue(interpolation)
}

export function matchInterpolationAlias(string: string) {
	return interpolationAliasMatcher(string)
}

// {# {var: nested}(value)>formatter1({}(args))>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}) #}

// {# { prop: { val1: nestedVariable, val2: 1 }(value)>formatter1(args:{}) #}

/*
const demo = "{ prop: 'my_value', prop2: { nested: 1, num: 2, deep: { done: true } }, horizontal: true }"

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

import { throwFalsy } from "@lib/error"
import { RegexBuilder } from "@lib/regex"
import { CALLBACK_BREAK } from "@src/constants/app.constants"
import {
	INTERPOLATION_ALIAS_PATTERN,
	INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN,
} from "@src/core/translation/constants/translation-patterns.constants"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import UnknownValue from "@src/core/translation/errors/interpolation/unknown-value.error"
import UntrimmedString from "@src/core/translation/errors/untrimmed-string.error"
import {
	matchArray,
	matchBoolean,
	matchEmpty,
	matchNull,
	matchNumber,
	matchObject,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/translation/functions/matching.functions"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import type { FormatterMatch, Matcher } from "@src/core/translation/types"

/**
 * Matches an interpolation's alias.
 * @param alias gor example "`(alias_name)>formatter1...`"
 */
const matchInterpolationAlias: Matcher = RegexBuilder.fromRegex(
	INTERPOLATION_ALIAS_PATTERN,
)
	.assertStarting()
	.build()
	.toMatcher()

/**
 * Matches a formatter until its first parenthesis (start of arguments).
 * @param formatter for example `">formatter1("true, "arg2", 1.5)>formatter2..."`
 */
const matchArgumentlessFormatter: Matcher = RegexBuilder.fromRegex(
	INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN,
)
	.assertStarting()
	.build()
	.toMatcher()

/**
 * Matches every part of an interpolation and returns them separately.
 * @param interpolation for example `"'value'(alias)>formatter(arg)"`.
 */
export function matchInterpolation(interpolation: string) {
	interpolation = interpolation.trim()

	const raw = interpolation

	const {
		value,
		type,
		end: valueEnd,
	} = matchInterpolationValue(interpolation)

	interpolation = interpolation.slice(valueEnd).trim()

	let alias = null

	const aliasMatch = matchInterpolationAlias(interpolation)
	if (aliasMatch) {
		const { match, range } = aliasMatch

		alias = match[1] || throwFalsy()

		interpolation = interpolation.slice(range[1]).trim()
	}

	const formatters: FormatterMatch[] = []

	while (interpolation.length > 0) {
		const { match, range } = matchArgumentlessFormatter(interpolation) || {}
		if (!match?.[1] || !range) break

		interpolation = interpolation.slice(range[1]).trim()

		if (!match[2]) {
			formatters.push({
				name: match[1],
				args: [],
			})
			continue
		}

		const { args, end } = matchFormatterArguments(interpolation)
		interpolation = interpolation.slice(end).trim()

		formatters.push({
			name: match[1],
			args,
		})
	}

	return {
		raw,
		value,
		type,
		alias,
		formatters,
	}
}

/**
 * Matches an interpolation's value.
 * @param value for example "`{ prop: varName }(alias)>formatter1...`"
 */
function matchInterpolationValue(value: string) {
	if (/^\s+\S/.test(value)) throw new UntrimmedString(value)

	let matched = matchEmpty(value)
	if (matched) {
		return {
			value: "undefined",
			type: ValueType.UNDEFINED,
			end: matched.range[1],
		}
	}

	matched = matchUndefined(value)
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

	matched = matchVariable(value)
	if (matched) {
		return {
			value: matched.match[0] || throwFalsy(),
			type: ValueType.VARIABLE,
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

	matched = matchObject(value)
	if (matched) {
		return {
			value: matched.match[0] || throwFalsy(),
			type: ValueType.OBJECT,
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

	throw new UnknownValue(value)
}

/**
 * Matches the formatter's arguments until the end of the formatter
 * (closing `")"`).
 * @param args The formatter's arguments, starts after the first `"("`.
 * For example `"true, "arg2", 1.5)>formatter2..."`.
 */
function matchFormatterArguments(args: string) {
	const result = {
		args: [] as string[],
		end: 0,
	}

	let current = ""
	let hasOpeningParenthesis = false
	depthAwareforEach(args, (char, i, depth) => {
		if (char === "(") hasOpeningParenthesis = true

		if (depth > 0) {
			current += char
			return null
		}

		if (char === ",") {
			result.args.push(current.trim())
			current = ""
			return null
		}

		if (char === ")") {
			if (hasOpeningParenthesis) current += char
			result.args.push(current.trim())
			result.end = i
			current = ""
			return CALLBACK_BREAK
		}

		current += char
		return null
	})

	return result
}

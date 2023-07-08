import { throwError } from "@lib/error"
import { RegexBuilder } from "@lib/regex"
import {
	INTERPOLATION_ALIAS_PATTERN,
	INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN,
} from "@src/constants/patterns.constants"
import { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"
import UnknownValue from "@src/core/parsing/errors/unknown-value.error"
import UntrimmedString from "@src/core/parsing/errors/untrimmed-string.error"
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
import UnreachableCode from "@src/errors/unreachable-code.error"
import type {
	InterpolationFormatter,
	Formatter,
	Matcher,
} from "@src/core/parsing/types"

const interpolationAliasMatcher: Matcher = RegexBuilder.fromRegex(
	INTERPOLATION_ALIAS_PATTERN,
)
	.assertStarting()
	.build()
	.toMatcher()

const interpolationArgumentlessFormatterMatcher: Matcher =
	RegexBuilder.fromRegex(INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN)
		.assertStarting()
		.build()
		.toMatcher()

class Interpolation {
	raw: string

	value: (
		options: Record<string, any>,
		formatters: Record<string, Formatter>,
	) => unknown

	alias: string | null = null

	formatters: InterpolationFormatter[] = []

	constructor(interpolation: string) {
		const { raw, value, type, alias, formatters } =
			Interpolation.#match(interpolation)

		this.raw = raw

		this.value = Interpolation.#parseValue(value, type)

		this.alias = alias
	}

	/**
	 * Creates the interpolation value getter for the given `string`.
	 * @param string for example: "{ prop: interpolationValue }".
	 */
	static #parseValue(string: string, type: InterpolationValueType) {
		let value: Interpolation["value"]

		switch (type) {
			case InterpolationValueType.Undefined: {
				value = () => undefined
				break
			}
			case InterpolationValueType.Null: {
				value = () => null
				break
			}
			// @ts-expect-error
			case InterpolationValueType.Boolean: {
				if (string === "true") {
					value = () => true
					break
				}
				if (string === "false") {
					value = () => false
					break
				}
				// fallthrough
			}
			case InterpolationValueType.Number: {
				value = () =>
					string.includes(".")
						? Number.parseFloat(string)
						: Number.parseInt(string, 10)
				break
			}
			case InterpolationValueType.Variable: {
				value = (props) => props[string]
				break
			}
			case InterpolationValueType.String: {
				value = () => string.slice(1, -1)
				break
			}
			case InterpolationValueType.Object: {
				value = () => ({}) // parse object (every prop value = interpolation)
				break
			}
			case InterpolationValueType.Array: {
				value = () => [] // parse array (every prop value = interpolation)
				break
			}
			default: {
				throw new UnknownValue(string)
			}
		}

		return value
	}

	/**
	 * Matches every part of an interpolation and returns them separately.
	 * @param interpolation for example `"'value'(alias)>formatter(arg)"`.
	 */
	static #match(interpolation: string) {
		interpolation = interpolation.trim()

		const raw = interpolation

		const { value, type, end: valueEnd } = this.#matchValue(interpolation)

		interpolation = interpolation.slice(valueEnd).trim()

		let alias = null

		const aliasMatch = this.#matchAlias(interpolation)
		if (aliasMatch) {
			const { match, range } = aliasMatch

			alias = match[1] || throwError(new UnreachableCode())

			interpolation = interpolation.slice(range[1]).trim()
		}

		const formatters: { name: string; arguments: string[] }[] = []

		while (interpolation.length > 0) {
			const argumentlessFormatterMatch =
				this.#matchArgumentlessFormatter(interpolation)
			if (!argumentlessFormatterMatch) break

			const { match, range } = argumentlessFormatterMatch

			const name = match[1] || throwError(new UnreachableCode())

			interpolation = interpolation.slice(range[1]).trim()

			const { args, end } = this.#matchFormatterArguments(interpolation)

			interpolation = interpolation.slice(end).trim()

			formatters.push({
				name,
				arguments: args,
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
	static #matchValue(value: string) {
		if (/^\s/.test(value)) throw new UntrimmedString(value)

		let matched = matchUndefined(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Undefined,
				end: matched.range[1],
			}
		}

		matched = matchNull(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Null,
				end: matched.range[1],
			}
		}

		matched = matchBoolean(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Boolean,
				end: matched.range[1],
			}
		}

		matched = matchNumber(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Number,
				end: matched.range[1],
			}
		}

		matched = matchVariable(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Variable,
				end: matched.range[1],
			}
		}

		matched = matchString(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.String,
				end: matched.range[1],
			}
		}

		matched = matchObject(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Object,
				end: matched.range[1],
			}
		}

		matched = matchArray(value)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Array,
				end: matched.range[1],
			}
		}

		throw new UnknownValue(value)
	}

	/**
	 * Matches an interpolation's alias.
	 * @param alias gor example "`(alias_name)>formatter1...`"
	 */
	static #matchAlias(alias: string) {
		return interpolationAliasMatcher(alias)
	}

	/**
	 * Matches a formatter until its first parenthesis (start of arguments).
	 * @param formatter for example `">formatter1("true, "arg2", 1.5)>formatter2..."`
	 */
	static #matchArgumentlessFormatter(formatter: string) {
		return interpolationArgumentlessFormatterMatcher(formatter)
	}

	/**
	 * Matches the formatter's arguments until the end of the formatter
	 * (closing `")"`).
	 * @param args The formatter's arguments, starts after the first `"("`.
	 * For example `"true, "arg2", 1.5)>formatter2..."`.
	 */
	static #matchFormatterArguments(args: string) {
		const result = {
			args: [] as string[],
			end: 0,
		}

		let depth = 0
		let current = ""
		// eslint-disable-next-line unicorn/no-for-loop
		for (let i = 0; i < args.length; i += 1) {
			const char = args[i] || throwError(new UnreachableCode())

			if (char === "{" || char === "[") depth += 1
			else if (char === "}" || char === "]") depth -= 1

			if (depth > 0) {
				current += char
				continue
			}

			if (char === ",") {
				result.args.push(current.trim())
				current = ""
				continue
			}

			if (char === ")") {
				result.args.push(current.trim())
				result.end = i + 1
				break
			}

			current += char
		}

		return result
	}
}

// {# {var: nested}(value)>formatter1({}(args))>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}) #}

export default Interpolation

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

		this.alias = alias

		// parsing value
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
	}

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

	static #matchValue(interpolation: string) {
		if (/^\s/.test(interpolation)) throw new UntrimmedString(interpolation)

		let matched = matchUndefined(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Undefined,
				end: matched.range[1],
			}
		}

		matched = matchNull(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Null,
				end: matched.range[1],
			}
		}

		matched = matchBoolean(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Boolean,
				end: matched.range[1],
			}
		}

		matched = matchNumber(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Number,
				end: matched.range[1],
			}
		}

		matched = matchVariable(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Variable,
				end: matched.range[1],
			}
		}

		matched = matchString(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.String,
				end: matched.range[1],
			}
		}

		matched = matchObject(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Object,
				end: matched.range[1],
			}
		}

		matched = matchArray(interpolation)
		if (matched) {
			return {
				value: matched.match[0] || throwError(new UnreachableCode()),
				type: InterpolationValueType.Array,
				end: matched.range[1],
			}
		}

		throw new UnknownValue(interpolation)
	}

	static #matchAlias(string: string) {
		return interpolationAliasMatcher(string)
	}

	static #matchArgumentlessFormatter(string: string) {
		return interpolationArgumentlessFormatterMatcher(string)
	}

	static #matchFormatterArguments(interpolation: string) {
		const result = {
			args: [] as string[],
			end: 0,
		}

		let depth = 0
		let current = ""
		// eslint-disable-next-line unicorn/no-for-loop
		for (let i = 0; i < interpolation.length; i += 1) {
			const char = interpolation[i] || throwError(new UnreachableCode())

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

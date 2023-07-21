import { throwFalsy } from "@lib/error"
import { RegexBuilder } from "@lib/regex"
import {
	INTERPOLATION_ALIAS_PATTERN,
	INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN,
} from "@src/constants/patterns.constants"
import { ValueType } from "@src/core/translation/enums/value-type.enum"
import UnknownValue from "@src/core/translation/errors/unknown-value.error"
import UntrimmedString from "@src/core/translation/errors/untrimmed-string.error"
import { depthAwareforEach } from "@src/core/translation/functions/parsing.functions"
import { CALLBACK_BREAK } from "@src/constants/app.constants"
import {
	matchArray,
	matchBoolean,
	matchNull,
	matchNumber,
	matchObject,
	matchString,
	matchUndefined,
	matchVariable,
} from "@src/core/translation/functions/matching.functions"
import type {
	Matcher,
	FormatterMatch,
	TranslationProperties,
	Formatters,
} from "@src/core/translation/types"

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

// TODO: make formatters accept parenthesisless names when no arguments are needed for example ">uppercase>lowercase"

class Interpolation {
	raw: string

	value: unknown

	alias: string | null = null

	constructor(
		interpolation: string,
		properties: TranslationProperties,
		availableFormatters: Formatters,
	) {
		const { raw, value, type, alias, formatters } =
			Interpolation.#match(interpolation)

		this.raw = raw

		this.alias = alias

		this.value = Interpolation.#parseValue(
			value,
			alias,
			type,
			formatters,
			properties,
			availableFormatters,
		)
	}

	/**
	 * Creates the interpolation value for the given `value`.
	 * @param value for example: `"{ prop: interpolationValue }"`.
	 */
	static #parseValue(
		value: string,
		alias: string | null,
		type: ValueType,
		formatters: FormatterMatch[],
		properties: TranslationProperties,
		availableFormatters: Formatters,
	) {
		let parsed: unknown

		switch (type) {
			case ValueType.UNDEFINED: {
				parsed = undefined
				break
			}
			case ValueType.NULL: {
				parsed = null
				break
			}
			case ValueType.BOOLEAN: {
				if (value === "true") {
					parsed = true
					break
				}
				if (value === "false") {
					parsed = false
					break
				}
				// fallthrough (default case if not true or false)
			}
			case ValueType.NUMBER: {
				parsed = value.includes(".")
					? Number.parseFloat(value)
					: Number.parseInt(value, 10)
				break
			}
			case ValueType.VARIABLE: {
				if (alias) {
					parsed = properties[alias]
					break
				}
				parsed = properties[value]
				break
			}
			case ValueType.STRING: {
				parsed = value.slice(1, -1)
				break
			}
			case ValueType.OBJECT: {
				parsed = this.#parseObject(
					value,
					properties,
					availableFormatters,
				)
				break
			}
			case ValueType.ARRAY: {
				parsed = this.#parseArray(
					value,
					properties,
					availableFormatters,
				)
				break
			}
			default: {
				throw new UnknownValue(value)
			}
		}

		// chain formatters
		for (const { name, args: rawArgs } of formatters) {
			const formatter = availableFormatters[name]
			if (!formatter) return undefined

			const args = rawArgs.map(
				(arg) =>
					new Interpolation(arg, properties, availableFormatters)
						.value,
			)
			parsed = formatter(parsed, ...args)
		}

		return parsed
	}

	/**
	 * Creates the interpolation value of type object.
	 */
	static #parseObject(
		object: string,
		properties: TranslationProperties,
		availableFormatters: Formatters,
	) {
		const parsed: Record<string, unknown> = {}

		let key = ""
		let value = ""
		let isKey = true
		depthAwareforEach(object, (char, _, depth, isOpening) => {
			if (depth === 0) {
				parsed[key] = new Interpolation(
					value,
					properties,
					availableFormatters,
				).value
				return CALLBACK_BREAK
			}

			if (depth === 1) {
				if (isKey) {
					if (isOpening) return null // ignore opening bracket
					if (/\s/.test(char)) return null
					if (char === ":") {
						isKey = false
						return null
					}
					key += char
				} else if (char === ",") {
					parsed[key] = new Interpolation(
						value,
						properties,
						availableFormatters,
					).value
					key = ""
					value = ""
					isKey = true
					return null
				}
			}

			if (!isKey) value += char
			return null
		})

		return parsed
	}

	/**
	 * Creates the interpolation value of type array.
	 */
	static #parseArray(
		array: string,
		properties: TranslationProperties,
		availableFormatters: Formatters,
	) {
		const parsed: unknown[] = []

		let value = ""
		depthAwareforEach(array, (char, _, depth, isOpening) => {
			if (depth === 0) {
				parsed.push(
					new Interpolation(value, properties, availableFormatters)
						.value,
				)
				return CALLBACK_BREAK
			}

			if (depth === 1) {
				if (isOpening) return null // ignore opening bracket
				if (char === ",") {
					parsed.push(
						new Interpolation(
							value,
							properties,
							availableFormatters,
						).value,
					)
					value = ""
					return null
				}
			}

			value += char
			return null
		})

		return parsed
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

			alias = match[1] || throwFalsy()

			interpolation = interpolation.slice(range[1]).trim()
		}

		const formatters: FormatterMatch[] = []

		while (interpolation.length > 0) {
			const argumentlessFormatterMatch =
				this.#matchArgumentlessFormatter(interpolation)
			if (!argumentlessFormatterMatch) break

			const { match, range } = argumentlessFormatterMatch

			const name = match[1] || throwFalsy()

			interpolation = interpolation.slice(range[1]).trim()

			const { args, end } = this.#matchFormatterArguments(interpolation)

			interpolation = interpolation.slice(end).trim()

			formatters.push({
				name,
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
	static #matchValue(value: string) {
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

		let current = ""

		depthAwareforEach(args, (char, i, depth) => {
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
				result.args.push(current.trim())
				result.end = i + 1
				return CALLBACK_BREAK
			}

			current += char
			return null
		})

		return result
	}
}

export default Interpolation

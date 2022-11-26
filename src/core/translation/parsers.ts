import { execOnce } from "$lib/string"
import {
	INTERPOLATION_DEFAULT_VALUE_CHARACTER,
	INTERPOLATION_FORMATTER_CHARACTER,
	VARIANT_ASSIGNATOR,
	VARIANT_SEPARATOR,
} from "$src/constants"
import type {
	InterpolationArgument,
	ParsedFormatter,
	ParsedInterpolation,
	TranslationKey,
	TranslationVariant,
	VariantProperty,
} from "$src/types/app"
import type { Primitive } from "$src/types/javascript"

export const variantPattern = /{([\dA-Za-z]+:[^}]+)}/g
const interpolationPattern = /{([\dA-Za-z]+)(:[^|}]+)?(|[^}]+)}/g
const validVariableNamePattern = /[\dA-Za-z]+/
const stringPattern = /^["'].+["']$/
const numberPattern = /^-? ?\d+(.\d+)?$/

/**
 * Parses a translation key.
 */
export function parseTranslationKey(string: string): TranslationKey {
	const variant = parseTranslationVariant(string)
	if (!variant) {
		return { name: string, variant: { name: string, properties: [] } }
	}
	return {
		name: string.replace(variantPattern, ""),
		variant,
	}
}

/**
 * Parsed the variant part of a translation key.
 */
function parseTranslationVariant(string: string) {
	const exec = execOnce(variantPattern, string)
	if (!exec) return undefined
	const { match } = exec
	if (!match[1]) return undefined
	const properties: VariantProperty[] = []
	for (const property of match[1].split(VARIANT_SEPARATOR)) {
		const [key, value] = property
			.split(VARIANT_ASSIGNATOR)
			.map((s) => s.trim())
		if (key === property) continue // property did not contain `VARIANT_ASSIGNATOR`
		if (!validVariableNamePattern.test(key)) continue
		const primitive = parsePrimitive(value)
		if (typeof primitive !== "string" && typeof primitive !== "number") {
			continue
		}
		properties.push({ name: key, value: primitive })
	}
	return {
		name: string,
		properties,
	} as TranslationVariant
}

/**
 * @returns An array of all the interpolations in `string` from the last to the
 * first.
 */
export function parseInterpolations(string: string) {
	const interpolations: ParsedInterpolation[] = []
	const matches = string.matchAll(interpolationPattern)
	for (const match of matches) {
		const interpolation = parseInterpolation(match)
		if (interpolation) interpolations.push(interpolation)
	}
	return interpolations.sort(
		// sorting interpolations from the last to the first
		(a, b) => b.range[1] - a.range[1],
	)
}

/**
 * Parses an interpolation from its regex match.
 */
function parseInterpolation(match: RegExpMatchArray) {
	if (match.index === undefined) return undefined
	const option: ParsedInterpolation = {
		name: "",
		default: undefined,
		formatters: [],
		range: [match.index, match.index + match[0].length],
	}
	for (let i = 1; i < match.length; i += 1) {
		if (!match[i]) continue
		if (i === 1) option.name = match[i]
		if (i === 2) option.default = parseDefaultValue(match[i])
		if (i === 3) option.formatters = parseFormatters(match[i])
	}
	if (option.name) return option
	return undefined
}

/**
 * Parses an interpolation's default value using the matching regex group (`string`).
 */
function parseDefaultValue(string: string) {
	if (string[0] !== INTERPOLATION_DEFAULT_VALUE_CHARACTER) return undefined
	return parsePrimitive(string.slice(1))
}

/**
 * Parses an interpolation's formatters using the matching regex group (`string`).
 */
function parseFormatters(string: string) {
	if (string[0] !== INTERPOLATION_FORMATTER_CHARACTER) return []
	return string
		.split(INTERPOLATION_FORMATTER_CHARACTER)
		.filter((formatter) => !!formatter) // empty indexes due to leading/trailing "|"
		.map((formatter): ParsedFormatter => {
			// if `formatter` has no arguments
			if (!/[\dA-Za-z]+\(.+\)/.test(formatter)) {
				return { name: formatter, arguments: [] }
			}
			// else we parse the arguments
			const argumentStart = formatter.indexOf("(")
			const name = formatter.slice(0, argumentStart)
			return {
				name,
				arguments: formatter
					.slice(argumentStart + 1, formatter.lastIndexOf(")"))
					.split(",")
					.map((argument) => parseFormatterArgument(argument.trim())),
			}
		})
}

/**
 * Parses the given trimmed `string` as if it was JS and creates a getter for
 * it. If `string` is not a primitive (`null` | `undefined` | `boolean` |
 * `string` | `number`) it will be considered as a key to retrieve a value in
 * the translation's options, and a getter will be created for that purpose.
 */
function parseFormatterArgument(string: string): InterpolationArgument {
	const argument = parsePrimitive(string, false)
	if (
		argument &&
		typeof argument === "object" &&
		validVariableNamePattern.test(string)
	) {
		return {
			getter: (options) => options?.[argument.name],
			name: argument.name,
		}
	}
	return {
		getter: () => argument,
	}
}

/**
 * Parses the given trimmed `string` as if it was JS. Only works with primitive
 * types (`null` | `undefined` | `boolean` | `string` | `number`).
 * @param throwOnNoPrimitive If false `parsePrimitive` won't throw when `string`
 * is not a primitive, and will instead return `string` wrapped in an object.
 * @throws When `string` is not a primitive, if `throwOnNoPrimitive` is true
 * (default behaviour).
 */
function parsePrimitive<Throw extends boolean = true>(
	string: string,
	throwOnNoPrimitive: Throw = true as any,
): Throw extends true ? Primitive : Primitive | { name: string } {
	if (string === "null") return null
	if (string === "undefined") return undefined
	if (string === "true") return true
	if (string === "false") return false

	let match = string.match(stringPattern)
	if (match) {
		return match[0].slice(1).slice(0, -1)
	}
	match = string.match(numberPattern)
	if (match) {
		return Number.parseFloat(match[0].replace(" ", ""))
	}

	if (throwOnNoPrimitive) {
		throw new Error(`Could not parse "${string}" (not a primitive).`)
	}
	return { name: string } as any
}

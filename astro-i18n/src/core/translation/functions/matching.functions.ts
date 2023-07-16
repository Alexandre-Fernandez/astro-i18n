import { RegexBuilder } from "@lib/regex"
import {
	NUMBER_PATTERN,
	VARNAME_PATTERN,
} from "@src/constants/patterns.constants"
import type { Matcher } from "@src/core/translation/types"

const numberMatcher: Matcher = RegexBuilder.fromRegex(NUMBER_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()

const variableMatcher: Matcher = RegexBuilder.fromRegex(VARNAME_PATTERN)
	.assertStarting()
	.build()
	.toMatcher()

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

export function matchNumber(string: string) {
	return numberMatcher(string)
}

export function matchVariable(string: string) {
	return variableMatcher(string)
}

export function matchString(string: string): ReturnType<Matcher> {
	const quoteType = string[0]
	if (quoteType !== '"' && quoteType !== "'" && quoteType !== "`") return null

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

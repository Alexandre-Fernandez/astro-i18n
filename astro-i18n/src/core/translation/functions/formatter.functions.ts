import { RegexBuilder } from "@lib/regex"
import { FUNCTION_PATTERN } from "@src/core/translation/constants/translation-patterns.constants"
import type {
	Formatters,
	SerializedFormatter,
	SerializedFormatters,
} from "@src/core/translation/types"

const functionMatcher = RegexBuilder.fromRegex(FUNCTION_PATTERN)
	.assertStarting()
	.assertEnding()
	.build()
	.toMatcher()

export function serializeFormatter(fn: Function) {
	const matched = functionMatcher(fn.toString())
	if (!matched) return { args: [], body: "" } as SerializedFormatter
	const [, args, body] = matched.match
	return {
		args: parseArguments(args || ""),
		body: parseBody(body || ""),
	} as SerializedFormatter
}

export function deserializeFormatters(formatters: SerializedFormatters) {
	const deserialized: Formatters = {}

	for (const [name, formatter] of Object.entries(formatters)) {
		// eslint-disable-next-line no-new-func
		deserialized[name] = new Function(
			...formatter.args,
			formatter.body,
		) as (value: unknown, ...args: unknown[]) => unknown
	}

	return deserialized
}

function parseArguments(args: string) {
	return args
		.trim()
		.split(",")
		.map((arg) => arg.trim())
}

function parseBody(body: string) {
	const trimmed = body.trim()
	return trimmed.endsWith("}") ? body.slice(0, -1) : body
}

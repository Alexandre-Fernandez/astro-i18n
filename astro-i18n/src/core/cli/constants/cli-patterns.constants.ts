import { Regex } from "@lib/regex"
import { PACKAGE_NAME } from "@src/constants/meta.constants"

export const GENERATED_TYPES_PATTERN = Regex.fromString(
	`\\/{2}\\s+###>\\s+${PACKAGE_NAME}\\/type-generation\\s+###\\n([\\s\\S]*)\\/{2}\\s+###<\\s+${PACKAGE_NAME}\\/type-generation ###`,
)

export const TRANSLATION_FUNCTION_PATTERN = new Regex(
	/t\s*\(\s*["'`]([\S\s]*?)["'`]\s*[),]/g,
)

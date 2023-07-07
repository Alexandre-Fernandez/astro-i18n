import { Regex, RegexBuilder } from "@lib/regex"

export const FIRST_VARCHAR_PATTERN = new Regex(/[$A-Z_a-z]/)

export const VARNAME_PATTERN = RegexBuilder.fromRegex(FIRST_VARCHAR_PATTERN)
	.appendPattern("[\\w$]*")
	.build()

export const NUMBER_PATTERN = new Regex(/\d+(?:\.\d+)?/)

export const INTERPOLATION_PATTERN = new Regex(/{#(.+)#}/)

export const INTERPOLATION_ALIAS_PATTERN = Regex.fromString(
	`\\(\\s*(${VARNAME_PATTERN.source})\\s*\\)`,
)

export const INTERPOLATION_FORMATTER_PATTERN = Regex.fromString(
	`>\\s*(${VARNAME_PATTERN.source})\\s*\\(.+\\)`,
)

console.log(INTERPOLATION_FORMATTER_PATTERN.source)

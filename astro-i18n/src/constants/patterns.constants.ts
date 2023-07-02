import { Regex, RegexBuilder } from "@lib/regex"

export const FIRST_VARCHAR_PATTERN = new Regex(/[$A-Z_a-z]/)

export const VARNAME_PATTERN = RegexBuilder.fromRegex(FIRST_VARCHAR_PATTERN)
	.appendPattern("[\\w$]*")
	.build()

export const NUMBER_PATTERN = new Regex(/\d+(?:\.\d+)?/)

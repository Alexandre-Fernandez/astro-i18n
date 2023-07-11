import { Regex, RegexBuilder } from "@lib/regex"
import { SUPPORTED_CONFIG_FORMATS } from "@src/constants/app.constants"
import { ASTRO_PACKAGE_NAME, PACKAGE_NAME } from "@src/constants/meta.constants"

export const FIRST_VARCHAR_PATTERN = new Regex(/[$A-Z_a-z]/)

export const VARNAME_PATTERN = RegexBuilder.fromRegex(FIRST_VARCHAR_PATTERN)
	.appendPattern("[\\w$]*")
	.build()

export const NUMBER_PATTERN = new Regex(/\d+(?:\.\d+)?/)

export const VARIANT_PATTERN = new Regex(/{{(.+)}}/)

export const INTERPOLATION_PATTERN = new Regex(/{#(.+)#}/)

export const INTERPOLATION_ALIAS_PATTERN = Regex.fromString(
	`\\(\\s*(${VARNAME_PATTERN.source})\\s*\\)`,
)

export const INTERPOLATION_ARGUMENTLESS_FORMATTER_PATTERN = Regex.fromString(
	`>\\s*(${VARNAME_PATTERN.source})\\s*\\(`,
)

export const ASTRO_I18N_CONFIG_PATTERN = Regex.fromString(
	`${PACKAGE_NAME}\\.config\\.(${SUPPORTED_CONFIG_FORMATS.join("|")})`,
)

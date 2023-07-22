import { Regex } from "@lib/regex"
import { SUPPORTED_CONFIG_FORMATS } from "@src/constants/app.constants"
import { PACKAGE_NAME } from "@src/constants/meta.constants"

export const ASTRO_I18N_CONFIG_PATTERN = Regex.fromString(
	`${PACKAGE_NAME}\\.config\\.(${SUPPORTED_CONFIG_FORMATS.join("|")})`,
)

export const ASTRO_CONFIG_PATTERN = Regex.fromString(
	`astro\\.config\\.(js|cjs|mjs|ts)`,
)

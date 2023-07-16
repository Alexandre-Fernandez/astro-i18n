import { Regex } from "@lib/regex"

export const ASTRO_COMPONENT_ROUTE_NAME_PATTERN = new Regex(
	/(\/[^\s/]+)?(\/[^\s/]+)\.astro$/,
)

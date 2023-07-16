import { Regex } from "@lib/regex"

export const FILE_ROUTE_NAME_PATTERN = new Regex(
	/(\/[^\s/]+)?(\/[^\s/]+)\.astro$/,
)

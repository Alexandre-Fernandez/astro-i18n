import { Regex } from "@lib/regex"
import {
	ROUTE_PARAM_PATTERN,
	URL_PATTERN,
} from "@src/core/routing/constants/routing-patterns.constants"

export function extractRouteParameters(route: string) {
	const parameters: string[] = []
	ROUTE_PARAM_PATTERN.exec(route, ({ match }) => {
		if (!match[2]) return
		parameters.push(match[2])
	})
	return parameters
}

export function isUrl(url: string) {
	return URL_PATTERN.test(url)
}

/**
 * Converts a page route such as `"/posts/[id]"` to a `Regex` that can be used
 * to match routes.
 */
export function pageRouteToRegex(route: string) {
	let pattern = ""
	let lastIndex = 0
	ROUTE_PARAM_PATTERN.exec(route, ({ match, range: [start, end] }) => {
		pattern += route.slice(lastIndex, start)
		if (!match[2]) {
			lastIndex = end
			return
		}
		pattern += match[1] ? "[\\w/-]+" : "[\\w-]+"
		lastIndex = end
	})
	pattern += route.slice(lastIndex)
	return Regex.fromString(
		pattern.replaceAll("/", "\\/"), // this will also escape the slash in "[\\w/-]+"
	)
}

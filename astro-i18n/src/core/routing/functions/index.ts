import {
	ROUTE_PARAM_PATTERN,
	URL_PATTERN,
} from "@src/core/routing/constants/routing-patterns.constants"

export function extractRouteParameters(route: string) {
	const parameters: string[] = []
	ROUTE_PARAM_PATTERN.exec(route, ({ match }) => {
		if (!match[1]) return
		parameters.push(match[1])
	})
	return parameters
}

export function isUrl(url: string) {
	return URL_PATTERN.test(url)
}

import { ROUTE_PARAM_PATTERN } from "@src/core/routing/constants/routing-patterns.constants"

export function extractRouteParameters(route: string) {
	const parameters: string[] = []
	ROUTE_PARAM_PATTERN.exec(route, ({ match }) => {
		if (!match[1]) return
		parameters.push(match[1])
	})
	return parameters
}

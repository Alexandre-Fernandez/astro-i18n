import { isObject } from "@lib/ts/guards"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { AstroI18nConfig } from "@src/core/config/types"
import type { AstroMiddleware } from "@src/core/astro/types"
import type { Formatters } from "@src/core/translation/types"

export const singleton = {
	value: 0,
}

export function useAstroI18n(
	config?: Partial<AstroI18nConfig> | string,
	formatters?: Formatters,
) {
	if (!config /* empty string */) config = undefined
	if (isObject(config) && Object.keys(config).length === 0) config = undefined

	return (async (_ctx, next) => {
		// init
		if (!astroI18n.isInitialized) {
			await astroI18n.initialize(config, formatters)
		}

		// setting route
		astroI18n.route = _ctx.url.pathname

		const response = await next()
		let body = await response.text()
		if (!body.startsWith("<!DOCTYPE html>")) return response

		// serializing astro-i18n into the html
		const closingHeadIndex = body.indexOf("</head>")
		if (closingHeadIndex > 0) {
			body =
				body.slice(0, closingHeadIndex) +
				astroI18n.internals.toHtml() +
				body.slice(closingHeadIndex)
		}

		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		})
	}) as AstroMiddleware
}

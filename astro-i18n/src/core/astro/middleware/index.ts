import { isObject } from "@lib/ts/guards"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { AstroI18nConfig } from "@src/core/config/types"
import type { AstroMiddleware } from "@src/core/astro/types"
import type { Formatters } from "@src/core/translation/types"

/**
 * The `astro-i18n` middleware.
 */
export function useAstroI18n(
	config?: Partial<AstroI18nConfig> | string,
	formatters?: Formatters,
) {
	if (!config /* empty string */) config = undefined
	if (isObject(config) && Object.keys(config).length === 0) config = undefined
	astroI18n.initialize(config, formatters)

	return (async (ctx, next) => {
		// init
		if (!astroI18n.isInitialized) {
			await astroI18n.internals.waitInitialization()
		}
		if (import.meta.env.DEV) {
			await astroI18n.internals.reinitalize(config, formatters)
		}

		// removing isGetStaticPaths
		astroI18n.internals.setPrivateProperties({
			isGetStaticPaths: false,
			origin: ctx.url.origin,
		})

		// setting route
		astroI18n.route = ctx.url.pathname

		if (astroI18n.internals.config.run !== "client+server") return next()

		const response = await next()

		// was redirected ?
		const redirection = astroI18n.internals.getAndClearRedirection()
		if (redirection) return redirection

		if (response.bodyUsed) return response
		let body = await response.text()

		if (!body.startsWith("<!DOCTYPE html>")) {
			return new Response(body, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
			})
		}

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
	}) satisfies AstroMiddleware as (...args: any[]) => any
}

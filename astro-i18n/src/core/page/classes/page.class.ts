import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	FRONTMATTER_PATTERN,
	GET_STATIC_PATHS_EXPORT_PATTERN,
	PRERENDER_EXPORT_PATTERN,
} from "@src/core/page/constants/page-patterns.constants"
import type { PageProps } from "@src/core/page/types"
import type AstroI18n from "@src/core/state/classes/astro-i18n.class"
import type { DeepStringRecord } from "@src/core/translation/types"

class Page implements PageProps {
	#name: string

	#route: string

	#path: string

	// page translations
	#translations: { [locale: string]: DeepStringRecord }

	// page segment translations
	#routes: { [secondaryLocale: string]: { [segment: string]: string } }

	#hasGetStaticPaths: boolean | undefined = undefined

	#prerender: boolean | null | undefined = undefined

	constructor({ name, route, path, translations, routes }: PageProps) {
		this.#name = name
		this.#route = route
		this.#path = path
		this.#translations = translations
		this.#routes = routes
	}

	get name() {
		return this.#name
	}

	get route() {
		return this.#route
	}

	get path() {
		return this.#path
	}

	get translations() {
		return this.#translations
	}

	get routes() {
		return this.#routes
	}

	async hasGetStaticPaths() {
		if (typeof this.#hasGetStaticPaths !== "undefined") {
			return this.#hasGetStaticPaths
		}
		const { readFileSync } = await AsyncNode.fs
		const data = readFileSync(this.#path, { encoding: "utf8" })
		const frontmatter = FRONTMATTER_PATTERN.match(data)?.match[0]
		this.#hasGetStaticPaths = frontmatter
			? GET_STATIC_PATHS_EXPORT_PATTERN.test(frontmatter)
			: false
		return this.#hasGetStaticPaths
	}

	async prerender() {
		if (typeof this.#prerender !== "undefined") {
			return this.#prerender
		}
		const { readFileSync } = await AsyncNode.fs
		const data = readFileSync(this.#path, { encoding: "utf8" })
		const frontmatter = FRONTMATTER_PATTERN.match(data)?.match[0]
		if (!frontmatter) {
			this.#prerender = false
			return this.#prerender
		}
		const { match } = PRERENDER_EXPORT_PATTERN.match(frontmatter) || {}
		if (!match) this.#prerender = null // no prerender
		else if (match[1]) this.#prerender = match[1] === "true" // assignation
		else this.#prerender = true // no assignation (default to true)
		return this.#prerender
	}

	/**
	 * @param route The translated route for which we are making the proxy.
	 */
	async getProxy(route: string, astroI18n: AstroI18n) {
		let srcPagesEndIndex: number | null = this.path.lastIndexOf("src/pages")
		srcPagesEndIndex =
			srcPagesEndIndex < 0 ? null : srcPagesEndIndex + "src/pages".length
		if (!srcPagesEndIndex) return null
		let proxy = ""

		// import page
		const pathFromPages = this.#path.slice(srcPagesEndIndex)
		const depth = route.split("/").length - 1
		const importPath = `${"../".repeat(depth)}${pathFromPages.slice(1)}`
		proxy += `---\nimport Page from "${importPath}"\n`

		// export getStaticPaths
		if (await this.hasGetStaticPaths()) {
			const { locale, route: localessRoute } =
				astroI18n.internals.splitLocaleAndRoute(route)
			proxy += `import { getStaticPaths as proxyGetStaticPaths } from "${importPath}"\n/* @ts-ignore */\nexport const getStaticPaths = (props) => proxyGetStaticPaths({ ...props, astroI18n: `
			proxy += `{ locale: "${locale}", route: "${localessRoute}", primaryLocale: "${
				astroI18n.primaryLocale
			}", secondaryLocales: ["${astroI18n.secondaryLocales.join(
				'", "',
			)}"] } })\n`
		}

		// export prerender
		const prerender = await this.prerender()
		if (typeof prerender === "boolean") {
			proxy += prerender
				? "export const prerender = true\n"
				: "export const prerender = false\n"
		}

		proxy += "const { props } = Astro\n---\n<Page {...props} />"

		return proxy
	}
}

export default Page

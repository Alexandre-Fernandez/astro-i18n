import {
	FRONTMATTER_PATTERN,
	GET_STATIC_PATHS_EXPORT_PATTERN,
	PRERENDER_EXPORT_PATTERN,
} from "@src/core/page/constants/page-patterns.constants"
import AsyncNode from "@lib/async-node/classes/async-node.class"
import type { PageProps } from "@src/core/page/types"
import type { DeepStringRecord } from "@src/core/translation/types"

class Page implements PageProps {
	name: string

	route: string

	path: string

	translations: { [locale: string]: DeepStringRecord }

	routes: { [secondaryLocale: string]: { [segment: string]: string } }

	constructor({ name, route, path, translations, routes }: PageProps) {
		this.name = name
		this.route = route
		this.path = path
		this.translations = translations
		this.routes = routes
	}

	async hasGetStaticPaths() {
		const { readFileSync } = await AsyncNode.fs
		const component = readFileSync(this.path, { encoding: "utf8" })
		const frontmatter = FRONTMATTER_PATTERN.match(component)?.match[0]
		if (!frontmatter) return false
		return GET_STATIC_PATHS_EXPORT_PATTERN.test(frontmatter)
	}

	async hasPrerender() {
		const { readFileSync } = await AsyncNode.fs
		const component = readFileSync(this.path, { encoding: "utf8" })
		const frontmatter = FRONTMATTER_PATTERN.match(component)?.match[0]
		if (!frontmatter) return false
		return PRERENDER_EXPORT_PATTERN.test(frontmatter)
	}
}

export default Page
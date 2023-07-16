import {
	forEachDirectory,
	isDirectory,
} from "@lib/async-node/functions/fs.functions"
import { throwError } from "@lib/error"
import { Regex } from "@lib/regex"
import { ASTRO_COMPONENT_ROUTE_NAME_PATTERN } from "@src/core/page/constants/page-patterns.constants"
import PagesNotFound from "@src/core/page/errors/pages-not-found.error"
import type { PageProps } from "@src/core/page/types"
import type { AstroI18nConfig } from "@src/core/state/types"
import UnreachableCode from "@src/errors/unreachable-code.error"

class Page {
	/*
		name,
		route,
		path: "",
		hasGetStaticPaths: false,
		hasPrerender: false,
		translations,
		routes
	*/

	static async getPages(root: string, config: Partial<AstroI18nConfig> = {}) {
		const pagesDir = `${root}/src/pages`
		if (!(await isDirectory(pagesDir))) throw new PagesNotFound()

		const pageData: { [route: string]: Partial<PageProps> } = {}
		const secondaryLocalePaths = (config.secondaryLocales || []).map(
			(locale) => `/src/pages/${locale}`,
		)
		const $directory = {
			main: "i18n",
			pages: "i18n",
			...config.translations?.$directory,
		}
		const i18nPagesDir = `${root}/src/${$directory.main}/pages`
		const locales = [
			config.primaryLocale || "en",
			...(config.secondaryLocales || []),
		]
		const translationFilePattern = Regex.fromString(
			`(\\/[^\\/\\s]+)?(?:\\/_?${$directory.pages})?\\/_?(${locales.join(
				"|",
			)})(\\.[^\\.\\s]+)?\\.json$`,
		)

		await forEachDirectory(pagesDir, async (dir, contents) => {
			if (secondaryLocalePaths.some((path) => dir.includes(path))) {
				return
			}

			for (const content of contents) {
				const path = `${dir}/${content}`
				if (await isDirectory(path)) continue

				const relative = path.replace(pagesDir, "") // pages based path

				if (relative.endsWith(".astro")) {
					const { match, range } =
						ASTRO_COMPONENT_ROUTE_NAME_PATTERN.match(relative) || {}
					if (!match || !range) continue

					const name =
						match[1] && match[2] === "/index"
							? match[1].replace("/", "")
							: match[2]?.replace("/", "") ||
							  throwError(new UnreachableCode())
					// check if is private
					if (name.startsWith("_")) continue

					const route = `${relative.slice(0, range[0])}/${name}`

					pageData[route] = { ...pageData[route], name, route, path }
					continue
				}

				if (!relative.endsWith(".json")) continue

				const { match, range } =
					translationFilePattern.match(relative) || {}
				if (!match || !range) continue

				const route = `${relative.slice(0, range[0])}${match[1] || "/"}`
				const locale = match[2] || throwError(new UnreachableCode())
				const translatedRoute = match[3]
					? match[3].replace(".", "")
					: null

				console.log(route, locale, translatedRoute)
			}
		})
	}
}

export default Page

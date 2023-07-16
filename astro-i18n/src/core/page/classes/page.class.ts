import {
	forEachDirectory,
	isDirectory,
} from "@lib/async-node/functions/fs.functions"
import { throwError } from "@lib/error"
import { Regex } from "@lib/regex"
import { importJson } from "@lib/async-node/functions/import.functions"
import { ASTRO_COMPONENT_ROUTE_NAME_PATTERN } from "@src/core/page/constants/page-patterns.constants"
import PagesNotFound from "@src/core/page/errors/pages-not-found.error"
import UnreachableCode from "@src/errors/unreachable-code.error"
import type { PageProps } from "@src/core/page/types"
import type { AstroI18nConfig } from "@src/core/state/types"
import { assert } from "@lib/ts/guards"
import { isDeepStringRecord } from "@src/core/state/guards/config-translations.guard"
import { merge } from "@lib/object"

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
		const locales = [
			config.primaryLocale || "en",
			...(config.secondaryLocales || []),
		]
		const translationFilePattern = Regex.fromString(
			`(\\/[^\\/\\s]+)?(?:\\/_?${$directory.pages})?\\/_?(${locales.join(
				"|",
			)})(\\.[^\\.\\s]+)?\\.json$`,
		)

		// get all pages and their translations in the pages directory
		await forEachDirectory(pagesDir, async (dir, contents) => {
			if (secondaryLocalePaths.some((path) => dir.includes(path))) {
				return
			}
			for (const content of contents) {
				const path = `${dir}/${content}`
				if (await isDirectory(path)) continue

				const relative = path.replace(pagesDir, "") // pages based path

				// component
				if (relative.endsWith(".astro")) {
					const { match, range } =
						ASTRO_COMPONENT_ROUTE_NAME_PATTERN.match(relative) || {}
					if (!match || !range) continue

					const name =
						match[1] && match[2] === "/index"
							? match[1].replace("/", "")
							: match[2]?.replace("/", "") ||
							  throwError(new UnreachableCode())
					if (name.startsWith("_")) continue // ignore if private
					const route =
						name === "index"
							? "/"
							: `${relative.slice(0, range[0])}/${name}`

					pageData[route] = { ...pageData[route], name, route, path }
					continue
				}
				// translations
				if (!relative.endsWith(".json")) continue

				const { match, range } =
					translationFilePattern.match(relative) || {}
				if (!match || !range) continue

				const route = `${relative.slice(0, range[0])}${match[1] || "/"}`
				const locale = match[2] || throwError(new UnreachableCode())
				const name = route.split("/").slice(-1).join("") || "index"
				const translatedName = match[3]
					? match[3].replace(".", "")
					: null

				const localeTranslations = await importJson(path)
				assert(
					localeTranslations,
					isDeepStringRecord,
					`${locale}.PageTranslations`,
				)
				// merging with existing locale translations
				merge(
					localeTranslations,
					pageData[route]?.translations?.[locale] || {},
				)
				const translations = {
					...pageData[route]?.translations,
					[locale]: localeTranslations,
				}

				const routes = translatedName
					? {
							...pageData[route]?.routes,
							[locale]: {
								[name]: translatedName,
							},
					  }
					: { ...pageData[route]?.routes }

				pageData[route] = {
					...pageData[route],
					name,
					route,
					translations,
					routes,
				}
			}
		})

		const pages: PageProps[] = [] // all pages with an astro component
		for (const page of Object.values(pageData)) {
			if (!page.path || !page.name || !page.route) continue
			pages.push({ translations: {}, routes: {}, ...page } as any)
		}

		const i18nPagesDir = `${root}/src/${$directory.main}/pages`

		if (!(await isDirectory(i18nPagesDir))) return pages // TODO: map to create Page instances

		// fetch page translations from i18nPagesDir and merge them

		console.log(pages)
	}
}

export default Page

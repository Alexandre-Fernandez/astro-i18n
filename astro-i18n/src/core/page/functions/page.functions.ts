import AsyncNode from "@lib/async-node/classes/async-node.class"
import { importJson } from "@lib/async-node/functions/import.functions"
import { throwError } from "@lib/error"
import { merge } from "@lib/object"
import { assert } from "@lib/ts/guards"
import { Regex } from "@lib/regex"
import {
	forEachDirectory,
	isDirectory,
} from "@lib/async-node/functions/fs.functions"
import PagesNotFound from "@src/core/page/errors/pages-not-found.error"
import { ASTRO_COMPONENT_ROUTE_NAME_PATTERN } from "@src/core/page/constants/page-patterns.constants"
import UnreachableCode from "@src/errors/unreachable-code.error"
import Page from "@src/core/page/classes/page.class"
import { isDeepStringRecord } from "@src/core/state/guards/config-translations.guard"
import InvalidTranslationFilePattern from "@src/core/page/errors/invalid-translation-file-pattern.error"
import type { PageProps } from "@src/core/page/types"
import type { AstroI18nConfig } from "@src/core/state/types"

/**
 * Fetches all the pages and their translations from the project.
 */
export async function getProjectPages(
	projectRoot: string,
	config: Partial<AstroI18nConfig> = {},
) {
	const pagesDir = `${projectRoot}/src/pages`
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
			const translatedName = match[3] ? match[3].replace(".", "") : null

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

	const i18nPagesDir = `${projectRoot}/src/${$directory.main}/pages`

	if (!(await isDirectory(i18nPagesDir))) {
		return pages.map((page) => new Page(page))
	}

	// merging translations from the root i18n dir
	for (const page of pages) {
		let dir = `${i18nPagesDir}${page.route}`.replace(/\/$/, "")
		if (!(await isDirectory(dir))) continue

		let pageTranslations = await getSrcPageTranslations(
			dir,
			page.name,
			translationFilePattern,
		)
		for (const { translations, routes } of pageTranslations) {
			merge(page.translations, translations)
			merge(page.routes, routes)
		}

		// also checking nested translation folder
		dir = `${dir}/${$directory.main}`
		if (!(await isDirectory(dir))) continue

		pageTranslations = await getSrcPageTranslations(
			dir,
			page.name,
			translationFilePattern,
		)
		for (const { translations, routes } of pageTranslations) {
			merge(page.translations, translations)
			merge(page.routes, routes)
		}
	}

	return pages.map((page) => new Page(page))
}

/**
 * This function is a shortcut to avoid repetition. It fetches the translations
 * for a given page from the /src translation directory.
 * @param i18nDir A directory in `"src/{i18n}/pages"`.
 * @param pageName The page name for which we are fetching the translations.
 * @param pattern The pattern matching the translation files we are looking for.
 * It should match the route name at index 1 (optional), the route locale at
 * index 2 and the translated name at index 3 (optional).
 */
export async function getSrcPageTranslations(
	i18nDir: string,
	pageName: string,
	pattern: Regex,
) {
	const { readdirSync } = await AsyncNode.fs

	const results: {
		translations: PageProps["translations"]
		routes: PageProps["routes"]
	}[] = []

	for (const content of readdirSync(i18nDir, { encoding: "utf8" })) {
		const { match } = pattern.match(`/${content}`) || {}
		if (!match) continue

		const locale =
			match[2] || throwError(new InvalidTranslationFilePattern())
		const translatedName = match[3] ? match[3].replace(".", "") : null
		const localeTranslations = await importJson(`${i18nDir}/${content}`)
		assert(
			localeTranslations,
			isDeepStringRecord,
			`${locale}.PageTranslations`,
		)

		results.push({
			translations: {
				[locale]: localeTranslations,
			},
			routes: translatedName
				? {
						[locale]: {
							[pageName]: translatedName,
						},
				  }
				: {},
		})
	}

	return results
}

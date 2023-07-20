import AsyncNode from "@lib/async-node/classes/async-node.class"
import { importJson } from "@lib/async-node/functions/import.functions"
import { throwError, throwFalsy } from "@lib/error"
import { merge } from "@lib/object"
import { assert } from "@lib/ts/guards"
import { Regex } from "@lib/regex"
import {
	forEachDirectory,
	isDirectory,
} from "@lib/async-node/functions/fs.functions"
import PagesNotFound from "@src/core/page/errors/pages-not-found.error"
import { ASTRO_COMPONENT_ROUTE_NAME_PATTERN } from "@src/core/page/constants/page-patterns.constants"
import Page from "@src/core/page/classes/page.class"
import InvalidTranslationFilePattern from "@src/core/page/errors/invalid-translation-file-pattern.error"
import { isDeepStringRecord } from "@src/core/translation/guards/deep-string-record.guard"
import type { PageProps } from "@src/core/page/types"
import type { AstroI18nConfig } from "@src/core/config/types"
import {
	DEFAULT_TRANSLATION_DIRNAME,
	PAGES_DIRNAME,
} from "@src/constants/app.constants"

/**
 * Fetches all the pages and their translations from the project.
 */
export async function getProjectPages(
	projectRoot: string,
	config: Partial<AstroI18nConfig> = {},
) {
	const pagesDir = `${projectRoot}/src/${PAGES_DIRNAME}`
	if (!(await isDirectory(pagesDir))) throw new PagesNotFound()

	const pageData: { [route: string]: Partial<PageProps> } = {}
	const secondaryLocalePaths = (config.secondaryLocales || []).map(
		(locale) => `/src/${PAGES_DIRNAME}/${locale}`,
	)
	const $directory = {
		main: DEFAULT_TRANSLATION_DIRNAME,
		pages: DEFAULT_TRANSLATION_DIRNAME,
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
						: match[2]?.replace("/", "") || throwFalsy()
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
			const locale = match[2] || throwFalsy()
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

	const pages: PageProps[] = []
	for (const page of Object.values(pageData)) {
		if (!page.path || !page.name || !page.route) continue
		// all pages that have an astro component (defined page.path)
		pages.push({ translations: {}, routes: {}, ...page } as any)
	}

	const i18nPagesDir = `${projectRoot}/src/${$directory.main}/${PAGES_DIRNAME}`

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
 * Meant to be used inside getProjectPages to avoid repetition.
 * @param i18nDir A directory in `"src/{i18n}/pages"`.
 * @param pageName The page name for which we are fetching the translations.
 * @param pattern The pattern matching the translation files we are looking for.
 * It should match the route name at index 1 (optional), the route locale at
 * index 2 and the translated name at index 3 (optional).
 */
async function getSrcPageTranslations(
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
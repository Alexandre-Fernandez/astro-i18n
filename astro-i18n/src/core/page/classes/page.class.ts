import {
	forEachDirectory,
	isDirectory,
} from "@lib/async-node/functions/fs.functions"
import { Regex } from "@lib/regex"
import PagesNotFound from "@src/core/page/errors/pages-not-found.error"
import type { AstroI18nConfig } from "@src/core/state/types"

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

		const secondaryLocalePaths = (config.secondaryLocales || []).map(
			(locale) => `/src/pages/${locale}`,
		)
		const $directory = {
			main: "i18n",
			pages: "i18n",
			...config.translations?.$directory,
		}
		const mainDirPattern = Regex.fromString(`^_?${$directory.main}$`)
		const pageDirPattern = Regex.fromString(`^_?${$directory.pages}$`)

		forEachDirectory(pagesDir, (dir, contents) => {
			if (secondaryLocalePaths.some((path) => dir.includes(path))) {
				return
			}

			for (const content of contents) {
				const path = `${dir}/${content}`
				const relative = path.replace(pagesDir, "")
				console.log(relative)
			}
		})

		// https://github.com/Alexandre-Fernandez/astro-i18n/blob/0a7767c95d743c0beb5000ff2f96b1ea596cf0ad/src/core/fs/index.ts#L51
	}
}

export default Page

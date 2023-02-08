import { resolve, sep } from "node:path"
import { isDirectory } from "$lib/filesystem"
import { merge } from "$lib/object-literal"
import type { Command } from "$lib/argv"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import { translatePath } from "$src/core/routing"
import { removeRouteLangCode } from "$src/core/routing/lang.code"
import { generatePageProxy } from "$src/core/fs/generators/page.proxy"
import { generateAmbientType } from "$src/core/fs/generators/ambient.type"
import {
	getPagesDirectoryRootRelativePath,
	getPagesMetadata,
} from "$src/core/fs"

export const sync: Command = {
	name: "sync",
	options: [
		{
			name: "config",
			shortcut: "c",
		},
	],
}

export async function executeSync(
	args: string[],
	options: {
		config?: string[]
	},
) {
	const root = args.at(0) ?? process.cwd()
	if (!root) throw noAstroRoot()
	const pages = resolve(root, getPagesDirectoryRootRelativePath())
	const config = options.config?.at(0) && resolve(root, options.config[0])
	if (!isDirectory(pages)) throw astroRootNotFound(pages)

	const astroI18nConfig = await loadAstroI18nConfig(root, config)

	const pagesMetadata = getPagesMetadata(root, astroI18nConfig)
	merge(astroI18nConfig.translations, pagesMetadata.translations)
	merge(astroI18nConfig.routeTranslations, pagesMetadata.routeTranslations)

	const routes = []

	for (const page of pagesMetadata.pages) {
		routes.push(removeRouteLangCode(page.route, astroI18nConfig))

		for (const langCode of astroI18nConfig.supportedLangCodes) {
			// generating page proxies
			generatePageProxy(
				pagesMetadata.directory,
				page.path,
				translatePath(page.path, langCode, astroI18nConfig, sep),
				page.hasGetStaticPaths,
			)
		}
	}

	generateAmbientType(root, {
		astroI18nConfig,
		pagesMetadata,
		routes,
	})
}

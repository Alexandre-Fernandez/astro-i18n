import { resolve, sep } from "node:path"
import { isDirectory } from "$lib/filesystem"
import { merge } from "$lib/object-literal"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import { translatePath } from "$src/core/routing"
import { generatePageProxy } from "$src/core/fs/generators/page.proxy"
import {
	getPagesDirectoryRootRelativePath,
	getPagesMetadata,
} from "$src/core/fs"
import type { Command } from "$lib/argv"

export const syncPages: Command = {
	name: "sync:pages",
	options: [
		{
			name: "config",
			shortcut: "c",
		},
	],
}

export async function executeSyncPages(
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
	merge(astroI18nConfig.routeTranslations, pagesMetadata.routeTranslations)

	for (const page of pagesMetadata.pages) {
		for (const langCode of astroI18nConfig.supportedLangCodes) {
			generatePageProxy(
				pagesMetadata.directory,
				page.path,
				translatePath(page.path, langCode, astroI18nConfig, sep),
				page.hasGetStaticPaths,
				page.originPrerender,
			)
		}
	}
}

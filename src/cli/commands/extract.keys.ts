import { resolve } from "node:path"
import { isDirectory } from "$lib/filesystem"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { getPagesDirectoryRootRelativePath } from "$src/core/fs"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import type { Command } from "$lib/argv"
import { generateExtractedKeys } from "$src/core/fs/generators/extracted.keys"
import { ASTRO_I18N_DIRECTORY } from "$src/constants"

export const extractKeys: Command = {
	name: "extract:keys",
	options: [],
}

export async function executeExtractKeys(
	args: string[],
	options: {
		config?: string[]
	},
) {
	const root = args.at(0) ?? process.cwd()
	if (!root) throw noAstroRoot()
	const config = options.config?.at(0) && resolve(root, options.config[0])
	const astroI18nConfig = await loadAstroI18nConfig(root, config)
	const pages = resolve(
		root,
		getPagesDirectoryRootRelativePath(astroI18nConfig),
	)

	if (!isDirectory(pages)) throw astroRootNotFound(pages)

	generateExtractedKeys(`${root}/src`, `${root}/${ASTRO_I18N_DIRECTORY}`)
}

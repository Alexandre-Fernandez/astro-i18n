import { resolve } from "node:path"
import { isDirectory } from "$lib/filesystem"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { getPagesDirectoryRootRelativePath } from "$src/core/fs"
import type { Command } from "$lib/argv"
import { generateExtractedKeys } from "$src/core/fs/generators/extracted.keys"
import { ASTRO_I18N_DIRECTORY } from "$src/constants"

export const extractKeys: Command = {
	name: "extract:keys",
	options: [],
}

export async function executeExtractKeys(args: string[]) {
	const root = args.at(0) ?? process.env.PWD
	if (!root) throw noAstroRoot()
	const pages = resolve(root, getPagesDirectoryRootRelativePath())
	if (!isDirectory(pages)) throw astroRootNotFound(pages)

	generateExtractedKeys(`${root}/src`, `${root}/${ASTRO_I18N_DIRECTORY}`)
}

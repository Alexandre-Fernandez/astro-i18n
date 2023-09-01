import { resolve } from "node:path"
import { isDirectory } from "$lib/filesystem"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { getPagesDirectoryRootRelativePath } from "$src/core/fs"
import { loadAstroI18nConfig } from "$src/core/fs/config"
import { generateAmbientType } from "$src/core/fs/generators/ambient.type"
import type { Command } from "$lib/argv"

export const syncTypes: Command = {
	name: "sync:types",
	options: [
		{
			name: "config",
			shortcut: "c",
		},
	],
}

export async function executeSyncTypes(
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

	generateAmbientType(root, undefined, config)
}

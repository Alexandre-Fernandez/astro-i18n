import { readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import {
	importJson,
	isDirectory,
	isFile,
	writeNestedFile,
} from "$lib/filesystem"
import { merge } from "$lib/object-literal"
import { astroRootNotFound, noAstroRoot } from "$src/cli/errors"
import { getPagesDirectoryRootRelativePath } from "$src/core/fs"
import { generateDefaultAstroI18nConfig } from "$src/core/fs/generators/astro.i18n.config"
import { generateEnvDeclaration } from "$src/core/fs/generators/env.declaration"
import { generateAstroConfig } from "$src/core/fs/generators/astro.config"
import { DENO_JSON, DENO_JSONC, PACKAGE_JSON } from "$src/constants"
import type { Command } from "$lib/argv"

const commands = {
	scripts: {
		"i18n:install": "astro-i18n install",
		"i18n:sync": "astro-i18n sync",
	},
}

export const install: Command = {
	name: "install",
	options: [
		{
			name: "config",
			shortcut: "c",
		},
	],
}

export async function executeInstall(
	args: string[],
	options: {
		config?: string[]
	},
) {
	const root = args.at(0) ?? process.env.PWD
	if (!root) throw noAstroRoot()
	const pages = resolve(root, getPagesDirectoryRootRelativePath())
	const config = options.config?.at(0) && resolve(root, options.config[0])
	if (!isDirectory(pages)) throw astroRootNotFound(pages)

	generateDefaultAstroI18nConfig(root, config)
	generateEnvDeclaration(root)
	generateAstroConfig(root)
	addAstroI18nCommands(root)
}

function addAstroI18nCommands(root: string) {
	const packageJsonPath = getPackageJsonPath(root)
	if (packageJsonPath) {
		const json = importJson<Record<string, unknown>>(packageJsonPath)
		if (!json) return
		merge(json, commands, { mode: "fill" })
		writeNestedFile(
			packageJsonPath,
			`${JSON.stringify(json, null, "\t")}\n`,
		)
		return
	}

	const denoJsonPath = getDenoJsonPath(root)
	if (denoJsonPath) {
		const json = importJson<Record<string, unknown>>(denoJsonPath)
		if (!json) return
		merge(json, denoifyCommands(commands), { mode: "fill" })
		writeNestedFile(denoJsonPath, `${JSON.stringify(json, null, "\t")}\n`)
	}
}

function getPackageJsonPath(root: string) {
	const packageJson = readdirSync(root)
		.filter((fullname) => fullname.toLowerCase() === PACKAGE_JSON)
		.at(0)
	if (packageJson) {
		const path = join(root, packageJson)
		if (!isFile(path)) return undefined
		return path
	}
	return undefined
}

function getDenoJsonPath(root: string) {
	const denoJson = readdirSync(root)
		.filter((fullname) => {
			const lower = fullname.toLowerCase()
			return lower === DENO_JSON || lower === DENO_JSONC
		})
		.at(0)
	if (denoJson) {
		const path = join(root, denoJson)
		if (!isFile(path)) return undefined
		return path
	}
	return undefined
}

function denoifyCommands(cmds: { scripts: Record<string, string> }) {
	const denoified: { tasks: Record<string, string> } = { tasks: {} }
	for (const [key, value] of Object.entries(cmds.scripts)) {
		denoified.tasks[key] = `deno run npm:${value}`
	}
	return denoified
}

import AsyncNode from "@lib/async-node/classes/async-node.class"
import { canRead, isFile } from "@lib/async-node/functions/fs.functions"
import { isRootPath, popPath } from "@lib/async-node/functions/path.functions"
import { RegexBuilder } from "@lib/regex"
import { ASTRO_I18N_CONFIG_PATTERN } from "@src/constants/patterns.constants"
import {
	NODE_MODULES_PATH_PATTERN,
	NODE_MODULES_SEGMENT_PATTERN,
	PACKAGE_DENO_JSON_PATTERN,
} from "@src/core/state/constants/path-patterns.constants"

const matchConfigPath = RegexBuilder.fromRegex(ASTRO_I18N_CONFIG_PATTERN)
	.assertEnding()
	.build()
	.toMatcher()

export async function autofindConfig(startingPath: string) {
	const { match } = NODE_MODULES_PATH_PATTERN.match(startingPath) || {}

	return searchConfigPath(
		match // if we are inside node_modules we go to the parent dir
			? match[0]?.replace(NODE_MODULES_SEGMENT_PATTERN.regexp, "") || "/"
			: startingPath,
	)
}

async function searchConfigPath(
	startingPath: string,
	crawlDirection = 1,
	root = true,
): Promise<null | string> {
	const { readdirSync } = await AsyncNode.fs

	if (await isFile(startingPath)) {
		if (matchConfigPath(startingPath)) return startingPath
		if (root) return searchConfigPath(await popPath(startingPath), 1, false)
		return null
	}

	if (!(await canRead(startingPath))) return null

	if (isRootPath(startingPath)) return null

	const dirContent = readdirSync(startingPath)

	// check for config
	const config = dirContent.find((file) =>
		ASTRO_I18N_CONFIG_PATTERN.test(file),
	)
	if (config) return `${startingPath}/${config}`

	if (crawlDirection > 0) {
		const isProjectRoot =
			typeof dirContent.find((name) =>
				PACKAGE_DENO_JSON_PATTERN.test(name),
			) === "string"
		// dir is not project root check next level up
		if (!isProjectRoot) {
			return searchConfigPath(await popPath(startingPath), 1, false)
		}
	}

	// filter sibling folders we don't want to crawl
	const filtered = dirContent.filter((name) => {
		switch (name) {
			case "node_modules": {
				return false
			}
			case "src": {
				return false
			}
			case "public": {
				return false
			}
			case "dist": {
				return false
			}
			case "build": {
				return false
			}
			default: {
				return !name.startsWith(".")
			}
		}
	})

	// crawl filtered sibling folders
	for (const name of filtered) {
		const path = `${startingPath}/${name}`
		if (await isFile(path)) continue

		const result = await searchConfigPath(path, -1, false)
		if (typeof result === "string") return result
	}

	// continue search or return
	return crawlDirection > 0
		? searchConfigPath(await popPath(startingPath), 1, false)
		: null
}

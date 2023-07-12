import AsyncNode from "@lib/async-node/classes/async-node.class"
import { canRead, isDirectory } from "@lib/async-node/functions/fs.functions"
import { isRootPath, popPath } from "@lib/async-node/functions/path.functions"
import { ASTRO_I18N_CONFIG_PATTERN } from "@src/constants/patterns.constants"
import {
	NODE_MODULES_PATH_PATTERN,
	NODE_MODULES_SEGMENT_PATTERN,
	PACKAGE_DENO_JSON_PATTERN,
} from "@src/core/state/constants/path-patterns.constants"

export async function autofindConfig(startingPath: string) {
	const { readdirSync } = await AsyncNode.fs

	const { match } = NODE_MODULES_PATH_PATTERN.match(startingPath) || {}

	const root = await findProjectRoot(
		match
			? match[0]?.replace(NODE_MODULES_SEGMENT_PATTERN.regexp, "") || "/"
			: startingPath,
	)
	if (!root) return null

	const config = readdirSync(root).find((file) =>
		ASTRO_I18N_CONFIG_PATTERN.test(file),
	)

	return `${root}/${config}`
}

async function findProjectRoot(startingPath: string) {
	const { readdirSync } = await AsyncNode.fs

	if (isRootPath(startingPath)) return null

	if (!(await canRead(startingPath))) return null

	if (await isDirectory(startingPath)) {
		const hasPackageJson =
			typeof readdirSync(startingPath).find((file) =>
				PACKAGE_DENO_JSON_PATTERN.test(file),
			) === "string"

		if (hasPackageJson) return startingPath
	}

	return findProjectRoot(await popPath(startingPath))
}

import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"

export async function isDirectory(path: string) {
	const { existsSync, lstatSync } = await AsyncNode.fs
	return existsSync(path) && lstatSync(path).isDirectory()
}

export async function isFile(path: string) {
	const { existsSync, lstatSync } = await AsyncNode.fs
	return existsSync(path) && !lstatSync(path).isDirectory()
}

export async function canRead(path: string) {
	const { accessSync, constants } = await AsyncNode.fs
	try {
		accessSync(path, constants.R_OK)
		return true
	} catch (_) {
		return false
	}
}

export async function forEachDirectory(
	startingDirectory: string,
	callback: (directory: string, contents: string[]) => unknown,
) {
	const { readdirSync } = await AsyncNode.fs

	const contents = readdirSync(startingDirectory)

	callback(await toPosixPath(startingDirectory), contents)

	for (const content of contents) {
		const path = `${startingDirectory}/${content}`
		if (!(await isDirectory(path))) continue
		forEachDirectory(path, callback)
	}
}

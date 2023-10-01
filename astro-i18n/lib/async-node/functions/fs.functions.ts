import AsyncNode from "@lib/async-node/classes/async-node.class"
import InvalidPath from "@lib/async-node/errors/invalid-path.error"
import {
	splitPath,
	toPosixPath,
} from "@lib/async-node/functions/path.functions"

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

	await callback(await toPosixPath(startingDirectory), contents)

	for (const content of contents) {
		const path = `${startingDirectory}/${content}`
		if (!(await isDirectory(path))) continue
		await forEachDirectory(path, callback)
	}
}

export async function writeNestedFile(path: string, data: string) {
	const { sep, join } = await AsyncNode.path
	const { writeFileSync, mkdirSync } = await AsyncNode.fs

	const segments = await splitPath(path)

	const file = segments.pop()
	if (!file) throw new InvalidPath()
	const directory = segments.join(sep)

	mkdirSync(directory, { recursive: true })
	writeFileSync(join(directory, file), data, { encoding: "utf8" })
}

export async function removeDirectory(path: string) {
	const { rmSync } = await AsyncNode.fs
	rmSync(path, { recursive: true, force: true })
}

import AsyncNode from "@lib/async-node/classes/async-node.class"

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

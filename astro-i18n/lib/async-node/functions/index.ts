import AsyncNode from "@lib/async-node/classes/async-node.class"

export async function toPosixPath(path: string) {
	const { sep, posix } = await AsyncNode.path
	return path.split(sep).join(posix.sep)
}

export async function toWindowsPath(path: string) {
	const { sep, win32 } = await AsyncNode.path
	return path.split(sep).join(win32.sep)
}

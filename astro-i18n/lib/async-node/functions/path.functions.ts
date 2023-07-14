import AsyncNode from "@lib/async-node/classes/async-node.class"

export async function toPosixPath(path: string) {
	const { sep, posix } = await AsyncNode.path
	return path.split(sep).join(posix.sep)
}

export async function toWindowsPath(path: string) {
	const { sep, win32 } = await AsyncNode.path
	return path.split(sep).join(win32.sep)
}

export async function popPath(path: string) {
	const sep = await getPathSeparator(path)
	const segments = path.split(sep)
	segments.pop()
	return segments.join(sep)
}

export function isRootPath(path: string) {
	switch (path) {
		case "": {
			return true
		}
		case "/": {
			return true
		}
		case "\\": {
			return true
		}
		default: {
			// path has no separators
			return !/[/\\]/.test(path)
		}
	}
}

async function getPathSeparator(path: string) {
	const { sep } = await AsyncNode.path
	const forward = path.split("/").length - 1
	const backward = path.split("\\").length - 1

	if (forward > backward) return "/"
	if (backward > forward) return "\\"
	return sep
}

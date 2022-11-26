import {
	readFileSync,
	existsSync,
	lstatSync,
	readdirSync,
	mkdirSync,
	writeFileSync,
} from "node:fs"
import { join, sep } from "node:path"
import type { FileSystemFlag, ParsedJson } from "./types"

/**
 * @returns undefined if the file could not be found or if the JSON was invalid,
 * else it will return the parsed JSON.
 */
export function importJson<Out extends ParsedJson = ParsedJson>(path: string) {
	try {
		return JSON.parse(readFileSync(path, "utf8")) as Out
	} catch (error) {
		return undefined
	}
}

/**
 * Will call `callback` for every directory including `directoryPath` and
 * provide `itemNames`, an array of the directory's file names and directory
 * names and `path`, the path to the directory.
 * @param directoryPath if not a directory `callback` will never be called.
 */
export function forEachDirectory(
	directoryPath: string,
	callback: (itemNames: string[], path: string) => any,
	ignoredPathPatterns: RegExp[] = [],
) {
	try {
		const itemNames = readdirSync(directoryPath)

		for (let i = 0; i < itemNames.length; i += 1) {
			const itemPath = join(directoryPath, itemNames[i]!)
			if (ignoredPathPatterns.some((regex) => regex.test(itemPath))) {
				itemNames.splice(i, 1)
				i -= 1
			} else if (isDirectory(itemPath, false)) {
				forEachDirectory(itemPath, callback)
			}
		}

		callback(itemNames, directoryPath)
	} catch (error) {
		// initial `directoryPath` was not a directory
	}
}

/**
 * @default verifyExistance = true
 * @throws {SystemError} if `verifyExistance` is false and `path` does not exist
 * else it just returns false.
 */
export function isDirectory(path: string, verifyExistance = true) {
	if (verifyExistance) {
		return existsSync(path) && lstatSync(path).isDirectory()
	}
	return lstatSync(path).isDirectory()
}

/**
 * @default verifyExistance = true
 * @throws {SystemError} if `verifyExistance` is false and `path` does not exist
 * else it just returns false.
 */
export function isFile(path: string, verifyExistance = true) {
	if (verifyExistance) {
		return existsSync(path) && !lstatSync(path).isDirectory()
	}
	return !lstatSync(path).isDirectory()
}

/**
 * Joins the paths and check if the result exists.
 * @throws {ReferenceError} if the resulting path doesn't exist.
 */
export function joinExists(...paths: string[]) {
	const path = join(...paths)
	if (!existsSync(path)) {
		throw new ReferenceError(`Path: ${path} doesn't exist.`)
	}
	return path
}

export function removeTrailingSep(path: string) {
	if (path.endsWith(sep)) return path.slice(0, -1)
	return path
}

export function removeLeadingSep(path: string) {
	if (path.startsWith(sep)) return path.slice(1)
	return path
}

export function getLastPathSegment(path: string) {
	return path.split(sep).pop()
}

export function writeNestedFile(
	path: string,
	data: string,
	flag?: FileSystemFlag,
) {
	const segments = removeTrailingSep(path).split(sep)
	const file = segments.pop() || ""
	const directory = segments.join(sep)
	mkdirSync(directory, { recursive: true })
	writeFileSync(join(directory, file), data, {
		encoding: "utf8",
		flag,
	})
}

/**
 * Splits the given `fileName` into `["name", "extension"]`.
 */
export function splitFileName(fileName: string) {
	const index = fileName.lastIndexOf(".")
	if (index < 0) return [fileName, ""]
	return [fileName.slice(0, index), fileName.slice(index + 1)]
}

/**
 * @returns The lowercase extension (e.g. `"json"`) or an empty string if no
 * extension was found.
 */
export function getFileExtension(file: string) {
	const i = file.lastIndexOf(".")
	if (i < 0) return ""
	return file.slice(i + 1).toLowerCase()
}

/**
 * @returns The name of the file without the extension, if there is no extension
 * it will return `file`.
 */
export function getFileName(file: string) {
	const i = file.lastIndexOf(".")
	if (i < 0) return file
	return file.slice(0, i)
}

/**
 * @returns An array `[fileName, fileExtension]`.
 */
export function getFileNameAndExtension(file: string): [string, string] {
	const i = file.lastIndexOf(".")
	if (i < 0) return [file, ""]
	return [file.slice(0, i), file.slice(i + 1)]
}

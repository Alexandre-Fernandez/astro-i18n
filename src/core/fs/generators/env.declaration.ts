import { join, sep } from "node:path"
import { readFileSync } from "node:fs"
import { execOnce } from "$lib/string"
import { isFile, writeNestedFile } from "$lib/filesystem"
import { ASTRO_I18N_DIRECTORY, GENERATED_DTS } from "$src/constants"
import { getEnvDtsRootRelativePath } from "$src/core/fs"
import { generateDefaultAmbientType } from "$src/core/fs/generators/ambient.type"

const referencedPath = `..${sep}${ASTRO_I18N_DIRECTORY}${sep}${GENERATED_DTS}`
const referencePathPattern = new RegExp(
	`/{3}(?: +)?<reference (?: +)?path=["'](${referencedPath})["'](?: +)?/>`,
)
const pathReference = `/// <reference path="${referencedPath}" />\n`

export function generateEnvDeclaration(root: string) {
	generateDefaultAmbientType(root)

	const envDtsPath = join(root, getEnvDtsRootRelativePath())
	if (!isFile(envDtsPath)) {
		writeNestedFile(envDtsPath, pathReference)
		return
	}

	const fileData = readFileSync(envDtsPath, "utf8")
	const newFileData = getReferencedPathContent(fileData)
	if (fileData !== newFileData) writeNestedFile(envDtsPath, newFileData)
}

/**
 * Makes sure that the reference path to the astro-i18n directory exists in
 * `content`.
 */
function getReferencedPathContent(content: string) {
	const match = execOnce(referencePathPattern, content)
	if (!match) return `${content}\n${pathReference}`
	return content
}

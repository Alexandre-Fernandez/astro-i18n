import { forEachDirectory, isDirectory, writeNestedFile } from "$lib/filesystem"
import { execOnce } from "$lib/string"
import { GENERATED_EXTRACTED_KEYS } from "$src/constants"
import { readFileSync } from "node:fs"
import { join, sep } from "node:path"

const extensionPattern = /.m?(?:ts|js|astro)$/

const tImportPattern =
	/import\s+(?:[\dA-Za-z]+)?,?(?:\s+)?{([^}]+t[\s,][^}]*)}?(?:\s+)?from(?:\s+)?["']astro-i18n["']/g

export function generateExtractedKeys(searchPath: string, outputDir: string) {
	const extractedKeys = getExtractedKeys(searchPath)
	writeNestedFile(
		join(outputDir, GENERATED_EXTRACTED_KEYS),
		JSON.stringify(extractedKeys, null, "\t"),
	)
}

function getExtractedKeys(searchPath: string) {
	const extractedKeys: Record<string, string> = {}

	forEachDirectory(searchPath, (itemNames, path) => {
		for (const itemName of itemNames) {
			if (!extensionPattern.test(itemName)) continue
			const itemPath = `${path}${sep}${itemName}`
			if (isDirectory(itemPath, false)) continue
			const code = readFileSync(itemPath, { encoding: "utf8" })
			const alias = getTAlias(code)
			if (!alias) continue
			for (const [, key] of code.matchAll(getFunctionPattern(alias))) {
				if (key) extractedKeys[key] = key
			}
		}
	})

	return extractedKeys
}

function getTAlias(code: string) {
	const exec = execOnce(tImportPattern, code)
	if (!exec || exec.match.length < 2) return undefined
	for (const valueAlias of exec.match[1].split(",")) {
		const [value, alias] = valueAlias.trim().split("as")
		const trimmedValue = value.trim()
		if (trimmedValue === "t") return alias?.trim() || trimmedValue
	}
	return undefined
}

function getFunctionPattern(fnName: string) {
	return new RegExp(`${fnName}\\(["']([\\s\\S]+?)["']\\)`, "g")
}

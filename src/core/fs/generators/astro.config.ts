import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
	getFileExtension,
	getFileName,
	isFile,
	writeNestedFile,
} from "$lib/filesystem"
import { execOnce, getExecs, replaceRange } from "$lib/string"
import {
	ASTRO_CONFIG,
	ASTRO_I18N_DEFAULT_IMPORT,
	PACKAGE_NAME,
} from "$src/constants"
import { isTypescriptProject } from "$src/core/fs"
import type { CodeFormat, Imports } from "$src/types/app"

const defaultAstroConfig = `import { defineConfig } from "astro/config"\nimport i18n from "${PACKAGE_NAME}"\n\nexport default defineConfig({ integrations: [i18n()] })\n`

// Code format detection
const esmExtensions = new Set(["mjs", "mts"])
const cjsExtensions = new Set(["cjs", "cts"])
const cjsPattern = /(?:require(?:\s+)?\()|(?:module\.exports)/
const esmPattern = /(?:import )|(?:export default )/
// ESM
const esmImportPattern =
	/import\s+([\dA-Za-z]+)?,?(?:\s+)?({[^}]+})?(?:\s+)?from(?:\s+)?["'](.+)["']/g
const esmDefaultExportPattern = /(export default [^{]+{)(\s+)?([\S\s]+)/
// CJS
const cjsImportPattern =
	/(?:const|var|let)\s+({[^}]+}|[\dA-Za-z]+)\s+=\s+require(?:\s+)?\((?:\s+)?["'`](.+)["'`]/g
const cjsDefaultExportPattern =
	/(module\.exports|exports\.default[^{]+{)(\s+)?([\S\s]+)/
// Shared
const integrationsPattern = /(?:[\S\s]+)?integrations(?:\s+)?:(?:\s+)?\[(\s+)?/

export function generateAstroConfig(root: string) {
	const path = findAstroConfig(root)

	if (!path) {
		writeNestedFile(
			join(
				root,
				isTypescriptProject(root)
					? `${ASTRO_CONFIG}.ts`
					: `${ASTRO_CONFIG}.mjs`,
			),
			defaultAstroConfig,
		)
		return
	}

	let code = readFileSync(path, "utf8")
	const format = getCodeFormat(code, path) || "ESM"

	if (format === "ESM") {
		const imports = getEsmImports(code)
		let defaultImportName = imports[PACKAGE_NAME]?.default
		if (defaultImportName) return // the default export is already imported, we assume astro-i18n is already integrated
		defaultImportName = getUniqueDefaultImportName(imports)
		code = integrateDefaultExport(
			"ESM",
			`import ${defaultImportName} from "${PACKAGE_NAME}"\n${code}`,
			defaultImportName,
		)
	} else {
		const imports = getCjsImports(code)
		let defaultImportName = imports[PACKAGE_NAME]?.default
		if (defaultImportName) return
		defaultImportName = getUniqueDefaultImportName(imports)
		code = integrateDefaultExport(
			"CJS",
			`const { default: ${defaultImportName} } = require("${PACKAGE_NAME}")\n${code}`,
			defaultImportName,
		)
	}

	writeNestedFile(path, code)
}

/**
 * Searches for the astro config file in the `root`.
 * @returns The path to the astro config file or `undefined` if not found.
 */
function findAstroConfig(root: string) {
	const config = readdirSync(root)
		.filter((fullname) => getFileName(fullname) === ASTRO_CONFIG)
		.at(0)
	if (config) {
		const path = join(root, config)
		if (!isFile(path)) return undefined
		return path
	}
	return undefined
}

/**
 * @returns The `code` format or `undefined` if the code is format agnostic
 * (plain JS or TS file).
 */
function getCodeFormat(code: string, path = ""): CodeFormat | undefined {
	const extension = getFileExtension(path)
	if (esmExtensions.has(extension)) return "ESM"
	if (cjsExtensions.has(extension)) return "CJS"
	if (esmPattern.test(code)) return "ESM"
	if (cjsPattern.test(code)) return "CJS"
	return undefined
}

function getEsmImports(code: string) {
	const imports: Imports = {}

	const execs = getExecs(esmImportPattern, code)
	for (const {
		match: [, defaultImport, rawNamedImports, source],
	} of execs) {
		if (!source) continue

		if (!imports[source]) imports[source] = {}

		if (defaultImport) imports[source].default = defaultImport

		let namedImports: string[][] = []
		if (rawNamedImports) {
			namedImports = rawNamedImports
				.replace(/^{|}$/g, "")
				.split(",")
				.map((namedImport) =>
					namedImport.split("as").map((n) => n.trim()),
				)
		}
		for (const [name, alias] of namedImports) {
			imports[source][name] = alias || name // if there's no alias, then the alias is the name
		}
	}

	return imports
}

function getCjsImports(code: string) {
	const imports: Imports = {}

	const execs = getExecs(cjsImportPattern, code)
	for (const {
		match: [, imported, source],
	} of execs) {
		if (!imported || !source) continue

		if (!imports[source]) imports[source] = {}

		if (!imported.startsWith("{")) {
			// default import
			imports[source].default = imported
			continue
		}

		const namedImports = imported
			.replace(/^{|}$/g, "")
			.split(",")
			.map((namedImport) => namedImport.split(":").map((n) => n.trim()))
		for (const [name, alias] of namedImports) {
			if (name === "default") {
				imports[source].default = alias
				continue
			}
			imports[source][name] = alias || name // if there's no alias, then the alias is the name
		}
	}

	return imports
}

function getUniqueDefaultImportName(imports: Imports) {
	const uniqueDefaultImportName = `${ASTRO_I18N_DEFAULT_IMPORT}_astro`
	for (const imported of Object.values(imports)) {
		for (const [, alias] of Object.entries(imported)) {
			if (alias === ASTRO_I18N_DEFAULT_IMPORT) {
				return uniqueDefaultImportName
			}
		}
	}
	return ASTRO_I18N_DEFAULT_IMPORT
}

function integrateDefaultExport(
	format: CodeFormat,
	code: string,
	importName: string,
) {
	const defaultExportExec = execOnce(
		format === "ESM" ? esmDefaultExportPattern : cjsDefaultExportPattern,
		code,
	)
	if (!defaultExportExec) {
		return format === "ESM"
			? `${code}\nexport default { integrations: ${importName}() }`
			: `${code}\nmodule.exports = { integrations: ${importName}() }`
	}
	const {
		match: [, untilConfigObject, configObjectWhitespace, restOfCode],
		range: [start, end],
	} = defaultExportExec

	return replaceRange(
		code,
		start,
		end,
		addIntegrationToConfigObject(
			importName,
			untilConfigObject,
			configObjectWhitespace,
			restOfCode,
		),
	)
}

/**
 * Works for ESM and CJS.
 * @param importName The integration import name.
 * @param untilConfigObject A string that starts wherever and ends at the first
 * curly bracket of the default export config object (included).
 * @param configObjectWhitespace The whitespace used between the config object
 * curly bracket and the first character after that.
 * @param restOfCode A string that starts after `configObjectWhitespace` and
 * ends wherever.
 * @returns `untilConfigObject` to `restOfCode` with the added integration.
 * e.g. `export default {}` => `export default {integrations:i18n()}`
 */
function addIntegrationToConfigObject(
	importName: string,
	untilConfigObject: string,
	configObjectWhitespace: string,
	restOfCode: string,
) {
	const exec = execOnce(integrationsPattern, restOfCode)
	if (!exec) {
		// config object didn't have an integrations array
		return `${untilConfigObject}${
			configObjectWhitespace || ""
		}integrations: [${importName}()],${
			configObjectWhitespace || ""
		}${restOfCode}`
	}
	const {
		match: [untilArray, arrayWhitespace],
	} = exec
	const restOfIntegratedCode = restOfCode.replace(
		untilArray,
		`${untilArray}${importName}(),${arrayWhitespace || ""}`,
	)
	return `${untilConfigObject}${
		configObjectWhitespace || ""
	}${restOfIntegratedCode}`
}

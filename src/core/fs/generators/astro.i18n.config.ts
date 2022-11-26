import { join } from "node:path"
import { getFileExtension, isFile, writeNestedFile } from "$lib/filesystem"
import { DEFAULT_CONFIG_NAME, PACKAGE_NAME } from "$src/constants"
import { isTypescriptProject } from "$src/core/fs"

const MODULE_CONFIG = `import { defineAstroI18nConfig } from "${PACKAGE_NAME}"\n\nexport default defineAstroI18nConfig({\n\tdefaultLangCode: "en",\n\tsupportedLangCodes: [],\n\tshowDefaultLangCode: false,\n\ttranslations: {},\n\trouteTranslations: {},\n})`
const COMMON_CONFIG = `const { defineAstroI18nConfig } = require("${PACKAGE_NAME}")\n\nmodule.exports = defineAstroI18nConfig({\n\tdefaultLangCode: "en",\n\tsupportedLangCodes: [],\n\tshowDefaultLangCode: false,\n\ttranslations: {},\n\trouteTranslations: {},\n})`
const JSON_CONFIG = `{\n\t"defaultLangCode": "en",\n\t"supportedLangCodes": [],\n\t"showDefaultLangCode: true,\n\t"translations": {},\n\t"routeTranslations": {}\n}`

const moduleExtensions = new Set(["js", "mjs", "ts", "mts"])
const commonExtensions = new Set(["cjs", "cts"])

export function generateDefaultAstroI18nConfig(
	root: string,
	customPathToConfig = "",
	override = false,
) {
	const configPath =
		customPathToConfig ||
		join(
			root,
			isTypescriptProject(root)
				? `${DEFAULT_CONFIG_NAME}.ts`
				: `${DEFAULT_CONFIG_NAME}.js`,
		)
	if (isFile(configPath) && !override) return

	if (customPathToConfig) {
		const extension = getFileExtension(customPathToConfig)

		if (moduleExtensions.has(extension)) {
			writeNestedFile(customPathToConfig, MODULE_CONFIG)
			return
		}
		if (commonExtensions.has(extension)) {
			writeNestedFile(customPathToConfig, COMMON_CONFIG)
			return
		}
		if (extension === "json") {
			writeNestedFile(customPathToConfig, JSON_CONFIG)
			return
		}
		throw new Error(
			`Unsupported extension ".${extension}" ("${customPathToConfig}").`,
		)
	}
	writeNestedFile(configPath, MODULE_CONFIG)
}

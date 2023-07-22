import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	canRead,
	isDirectory,
	isFile,
} from "@lib/async-node/functions/fs.functions"
import { importJson } from "@lib/async-node/functions/import.functions"
import { isRootPath, popPath } from "@lib/async-node/functions/path.functions"
import { Regex, RegexBuilder } from "@lib/regex"
import { assert, isRecord } from "@lib/ts/guards"
import {
	DEFAULT_TRANSLATION_DIRNAME,
	PAGES_DIRNAME,
} from "@src/constants/app.constants"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import {
	ASTRO_CONFIG_PATTERN,
	ASTRO_I18N_CONFIG_PATTERN,
} from "@src/core/config/constants/config-patterns.constants"
import { isDeepStringRecord } from "@src/core/translation/guards/deep-string-record.guard"
import { TRANSLATION_DIRECTORIES_KEY } from "@src/core/config/constants/config.constants"
import {
	DENO_JSON_PATTERN,
	DEPS_TS_PATTERN,
	NODE_MODULES_PATH_PATTERN,
	NODE_MODULES_SEGMENT_PATTERN,
	PACKAGE_DENO_JSON_PATTERN,
	PACKAGE_JSON_PATTERN,
} from "@src/core/config/constants/path-patterns.constants"
import type {
	AstroI18nConfig,
	ConfigTranslations,
} from "@src/core/config/types"

const astroI18nConfigPattern = RegexBuilder.fromRegex(ASTRO_I18N_CONFIG_PATTERN)
	.assertEnding()
	.build()

const astroConfigPattern = RegexBuilder.fromRegex(ASTRO_CONFIG_PATTERN)
	.assertEnding()
	.build()

/**
 * Separates ConfigTranslations common group from the route groups and the other
 * extra groups.
 */
export function categorizeConfigTranslationsGroups(
	configTranslations: ConfigTranslations,
) {
	const groups = {
		routes: [] as string[],
		extra: [] as string[],
		common: undefined as string | undefined,
	}
	for (const key of Object.keys(configTranslations)) {
		if (key.startsWith("/")) {
			groups.routes.push(key)
			continue
		}
		if (key === "common") {
			groups.common = "common"
			continue
		}
		groups.extra.push(key)
	}
	return groups
}

/**
 * Extracts all the non-page translation groups from the main astro-i18n
 * directory.
 */
export async function getProjectTranslationGroups(
	projectRoot: string,
	config: Partial<AstroI18nConfig> = {},
) {
	const i18nDir = `${projectRoot}/src/${
		config.translations?.[TRANSLATION_DIRECTORIES_KEY] ||
		DEFAULT_TRANSLATION_DIRNAME
	}`

	const groups: ConfigTranslations = {}

	if (!(await isDirectory(i18nDir))) return groups

	const { readdirSync } = await AsyncNode.fs

	const locales = [
		config.primaryLocale || "en",
		...(config.secondaryLocales || []),
	]
	const translationFilePattern = Regex.fromString(
		`(${locales.join("|")})\\.json`,
	)

	for (const group of readdirSync(i18nDir)) {
		if (group === PAGES_DIRNAME) continue
		const path = `${i18nDir}/${group}`
		if (!(await isDirectory(path))) continue

		for (const file of readdirSync(path)) {
			const { match } = translationFilePattern.match(file) || {}
			if (!match?.[1]) continue
			const locale = match[1]

			const translations = await importJson(`${path}/${file}`)
			assert(
				translations,
				isDeepStringRecord,
				`${locale}.GroupTranslations`,
			)
			groups[group] = {
				[locale]: translations,
			}
		}
	}

	return groups
}

/**
 * Crawls directories looking for an astro-i18n's config file and returns its
 * path.
 */
export async function autofindAstroI18nConfig(startingPath: string) {
	return searchProjectRootPattern(
		exitNodeModules(startingPath),
		astroI18nConfigPattern.regexp,
	)
}

/**
 * Crawls directories looking for an Astro's config file and returns the
 * directory where its contained.
 * If a package.json is found it also checks if we are in the dependencies.
 */
export async function autofindProjectRoot(startingPath: string) {
	const astroConfigPath = await searchProjectRootPattern(
		exitNodeModules(startingPath),
		astroConfigPattern.regexp,
	)
	if (!astroConfigPath) return null

	const { readdirSync } = await AsyncNode.fs

	const dir = await popPath(astroConfigPath)
	const contents = readdirSync(dir)

	const packageJson = contents.find((name) => PACKAGE_JSON_PATTERN.test(name))
	// checking if we are a dependency of package.json
	if (packageJson) {
		const json = await importJson(`${dir}/${packageJson}`)
		if (
			isRecord(json) &&
			isRecord(json["dependencies"]) &&
			json["dependencies"][PACKAGE_NAME]
		) {
			return dir
		}
	}

	const denoJson = contents.find((name) => DENO_JSON_PATTERN.test(name))
	// not checking deno import map because npm pkgs may not be mentionned
	if (denoJson) return dir

	const depsTs = contents.find((name) => DEPS_TS_PATTERN.test(name))
	if (depsTs) return dir

	return null
}

export async function hasAstroConfig(directory: string) {
	const { readdirSync } = await AsyncNode.fs
	return (
		typeof readdirSync(directory).find((content) =>
			astroConfigPattern.test(content),
		) === "string"
	)
}

/**
 * Removes all the path segments inside node_modules (including node_modules).
 * For example, `"/my/project/root/node_modules/nested/library"` will return
 * `"/my/project/root`.
 */
function exitNodeModules(path: string) {
	const { match } = NODE_MODULES_PATH_PATTERN.match(path) || {}
	return match
		? match[0]?.replace(NODE_MODULES_SEGMENT_PATTERN.regexp, "") || "/"
		: path
}

/**
 * Crawls every directory and parent directory containing a `package.json` or
 * `deno.json` looking for the given pattern.
 * If the directory is not a project root (contains `package.json`...), it will
 * search in the parent directory.
 */
async function searchProjectRootPattern(
	path: string,
	pattern: RegExp,
	crawlDirection = 1,
	isFirstIteration = true,
): Promise<null | string> {
	const { readdirSync } = await AsyncNode.fs

	if (await isFile(path)) {
		if (pattern.test(path)) return path
		if (isFirstIteration) {
			return searchProjectRootPattern(
				await popPath(path),
				pattern,
				1,
				false,
			)
		}
		return null
	}

	if (!(await canRead(path))) return null

	if (isRootPath(path)) return null

	const dirContent = readdirSync(path)

	// check for config
	const config = dirContent.find((file) => pattern.test(file))
	if (config) return `${path}/${config}`

	if (crawlDirection > 0) {
		const isProjectRoot =
			typeof dirContent.find((name) =>
				PACKAGE_DENO_JSON_PATTERN.test(name),
			) === "string"
		// dir is not project root check next level up
		if (!isProjectRoot) {
			return searchProjectRootPattern(
				await popPath(path),
				pattern,
				1,
				false,
			)
		}
	}

	// filter sibling folders we don't want to crawl
	const filtered = dirContent.filter((name) => {
		switch (name) {
			case "node_modules": {
				return false
			}
			case "src": {
				return false
			}
			case "public": {
				return false
			}
			case "dist": {
				return false
			}
			case "build": {
				return false
			}
			default: {
				return !name.startsWith(".")
			}
		}
	})

	// crawl filtered sibling folders
	for (const name of filtered) {
		const fullpath = `${path}/${name}`
		if (await isFile(path)) continue

		const result = await searchProjectRootPattern(
			fullpath,
			pattern,
			-1,
			false,
		)
		if (typeof result === "string") return result
	}

	// continue search or return
	return crawlDirection > 0
		? searchProjectRootPattern(await popPath(path), pattern, 1, false)
		: null
}

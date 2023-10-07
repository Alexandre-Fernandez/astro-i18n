import { isRecord } from "@lib/ts/guards"
import { merge } from "@lib/object"
import { importJson } from "@lib/async-node/functions/import.functions"
import { RegexBuilder } from "@lib/regex"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import AsyncNode from "@lib/async-node/classes/async-node.class"
import {
	isDirectory,
	isFile,
	writeNestedFile,
} from "@lib/async-node/functions/fs.functions"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { ASTRO_I18N_CONFIG_PATTERN } from "@src/core/config/constants/config-patterns.constants"
import {
	INDEX_FILENAME_PATTERN,
	MIDDLEWARE_FILENAME_PATTERN,
} from "@src/core/cli/constants/cli-patterns.constants"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import type { Command, ParsedArgv } from "@lib/argv/types"

const cmd = {
	name: "install",
	options: ["root"],
} as const satisfies Command

export async function install({ command, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const { writeFileSync } = await AsyncNode.fs
	const { join } = await AsyncNode.path

	const root = await toPosixPath(
		typeof options["root"] === "string" ? options["root"] : process.cwd(),
	)
	if (!(await isDirectory(root))) throw new RootNotFound()

	const isTypescript = await hasTsconfig(root)

	// create default config file
	if (!(await getAstroI18nConfigPath(root))) {
		writeFileSync(
			join(root, `${PACKAGE_NAME}.config.${isTypescript ? "ts" : "js"}`),
			`
import { defineAstroI18nConfig } from "astro-i18n"

export default defineAstroI18nConfig({
	primaryLocale: "en", // the default locale for your app
	secondaryLocales: [], // other supported locales
	fallbackLocale: "en", // if a translation is missing in a locale it will retry with the fallbackLocale
	trailingSlash: "never", // add trailing slashes to generated links
	run: "client+server", // where will ${PACKAGE_NAME} be able to run
	showPrimaryLocale: false, // show the primary locale in the generated routes (for example /en/about instead of /about)
	translationLoadingRules: [], // which translation group gets loaded in a page
	translationDirectory: {}, // set the name of ${PACKAGE_NAME} translation directories
	translations: {}, // you can put your translations here, for example { [group]: { [locale]: {...} } }
	routes: {}, // you can put your route segment translations here, for example { [secondary_locale]: { about: "about-translated-in-secondary_locale" } }
})
`.trim(),
		)
	}

	// add commands in package.json
	const pkgPath = join(root, "package.json")
	const pkg = (await isFile(pkgPath)) ? await importJson(pkgPath) : null
	if (pkg && isRecord(pkg)) {
		merge(pkg, {
			scripts: {
				"i18n:extract": "astro-i18n extract",
				"i18n:generate:pages": "astro-i18n generate:pages --purge",
				"i18n:generate:types": "astro-i18n generate:types",
				"i18n:sync":
					"npm run i18n:generate:pages && npm run i18n:generate:types",
			},
		})
		writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t"))
	}

	// add default middleware
	if (!(await getMiddlewarePath(root))) {
		writeNestedFile(
			join(
				root,
				"src",
				"middleware",
				`index.${isTypescript ? "ts" : "js"}`,
			),
			`
import { sequence } from "astro/middleware"
import { useAstroI18n } from "astro-i18n"

const astroI18n = useAstroI18n(
	undefined /* config */,
	undefined /* custom formatters */,
)

export const onRequest = sequence(astroI18n)
`.trim(),
		)
	}
}

async function getMiddlewarePath(root: string) {
	// src/middleware.js|ts (Alternatively, you can create src/middleware/index.js|ts.)
	const { readdirSync } = await AsyncNode.fs
	const { join } = await AsyncNode.path

	const src = join(root, "src")
	if (!(await isDirectory(src))) return null

	for (const filename of readdirSync(src)) {
		const path = join(src, filename)
		// flat
		if (MIDDLEWARE_FILENAME_PATTERN.test(filename)) {
			return path
		}
		// nested
		if (filename === "middleware" && (await isDirectory(filename))) {
			for (const middlewareFilename of readdirSync(path)) {
				if (INDEX_FILENAME_PATTERN.test(filename)) {
					return join(src, "middleware", middlewareFilename)
				}
			}
		}
	}
	return null
}

async function getAstroI18nConfigPath(root: string) {
	const { readdirSync } = await AsyncNode.fs
	const pattern = RegexBuilder.fromRegex(ASTRO_I18N_CONFIG_PATTERN)
		.assertEnding()
		.build()
	const content = readdirSync(root)
	for (const filename of content) {
		if (!(await isFile(filename))) continue
		if (pattern.test(filename)) return filename
	}
	return null
}

async function hasTsconfig(root: string) {
	const { join } = await AsyncNode.path
	return isFile(join(root, "tsconfig.json"))
}

export default cmd

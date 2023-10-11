import { importJson } from "@lib/async-node/functions/import.functions"
import { assert } from "@lib/ts/guards"
import { never } from "@lib/error"
import { merge, setObjectProperty } from "@lib/object"
import {
	isDirectory,
	isFile,
	writeNestedFile,
} from "@lib/async-node/functions/fs.functions"
import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import { isDeepStringRecord } from "@src/core/translation/guards/deep-string-record.guard"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import { TRANSLATION_FUNCTION_PATTERN } from "@src/core/cli/constants/cli-patterns.constants"
import {
	DEFAULT_TRANSLATION_DIRNAME,
	PAGES_DIRNAME,
} from "@src/constants/app.constants"
import type { Command, ParsedArgv } from "@lib/argv/types"
import type { FlatConfigTranslations } from "@src/core/cli/types"
import type { DeepStringRecord } from "@src/core/translation/types"

const cmd = {
	name: "extract",
	options: ["root"],
} as const satisfies Command

export async function extract({ command, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const { join } = await AsyncNode.path

	const root = await toPosixPath(
		typeof options["root"] === "string" ? options["root"] : process.cwd(),
	)
	if (!(await isDirectory(root))) throw new RootNotFound()

	await astroI18n.initialize()

	const groupTranslations: FlatConfigTranslations = {}
	const pageTranslations: FlatConfigTranslations = {}

	// extracting translations from pages
	const pages = await getProjectPages(root, astroI18n.internals.config)
	for (const page of pages) {
		TRANSLATION_FUNCTION_PATTERN.exec(
			await page.getContent(),
			({ match }) => {
				const key = match[2]
				if (!key) return

				let translations = groupTranslations
				let group = match[1] || ""
				if (match[1]) {
					group = match[1].replace(/^#/, "").replace(/#$/, "")
				} else {
					translations = pageTranslations
					group = page.route
				}

				// primary locale
				setObjectProperty(
					translations,
					[group || never(), astroI18n.primaryLocale, key],
					key,
				)
				// secondary locales
				for (const secondaryLocale of astroI18n.secondaryLocales) {
					setObjectProperty(
						translations,
						[group || never(), secondaryLocale, key],
						`${key}`,
					)
				}
			},
		)
	}

	const directories = {
		i18n: DEFAULT_TRANSLATION_DIRNAME,
		pages: DEFAULT_TRANSLATION_DIRNAME,
		...astroI18n.internals.config.translationDirectory,
	}
	const translationDirectory = join(root, "src", directories.i18n)

	// filling main i18n dir group translations
	for (const [group, locales] of Object.entries(groupTranslations)) {
		for (const [locale, translations] of Object.entries(locales)) {
			const path = join(translationDirectory, group, `${locale}.json`)
			const imported: DeepStringRecord = (await isFile(path))
				? await importDeepStringRecord(path)
				: {}
			merge(imported, translations, { mode: "fill" })
			writeNestedFile(path, JSON.stringify(imported, null, "\t"))
		}
	}

	// filling main i18n dir page translations (group === page.route)
	for (const [group, locales] of Object.entries(pageTranslations)) {
		for (const [locale, translations] of Object.entries(locales)) {
			const directory = join(
				translationDirectory,
				PAGES_DIRNAME,
				...group.replace(/^\//, "").replace(/\/$/, "").split("/"),
			)
			const [flatPath, nestedPath] = [
				join(directory, `${locale}.json`),
				join(directory, directories.pages, `${locale}.json`),
			]
			let path = (await isFile(nestedPath)) ? nestedPath : ""
			if (!path) path = (await isFile(flatPath)) ? flatPath : ""

			const imported: DeepStringRecord = path
				? await importDeepStringRecord(path)
				: {}
			merge(imported, translations, { mode: "fill" })
			writeNestedFile(
				path || nestedPath, // if no path was found use nested one
				JSON.stringify(imported, null, "\t"),
			)
		}
	}
}

async function importDeepStringRecord(filename: string) {
	const json = await importJson(filename)
	assert(json, isDeepStringRecord)
	return json
}

export default cmd

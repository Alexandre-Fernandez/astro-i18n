import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import {
	isDirectory,
	removeDirectory,
	writeNestedFile,
} from "@lib/async-node/functions/fs.functions"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { Command, ParsedArgv } from "@lib/argv/types"
import { PAGES_DIRNAME } from "@src/constants/app.constants"

const cmd = {
	name: "generate:pages",
	options: ["purge", "root"],
} as const satisfies Command

export async function generatePages({ command, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const { join } = await AsyncNode.path

	const root = await toPosixPath(
		typeof options["root"] === "string" ? options["root"] : process.cwd(),
	)
	if (!(await isDirectory(root))) throw new RootNotFound()

	await astroI18n.initialize()

	const pagesDirectory = join(
		root,
		`${astroI18n.internals.config.srcDir}/${PAGES_DIRNAME}`,
	)

	if (options["purge"]) {
		for (const locale of astroI18n.secondaryLocales) {
			const secondaryLocaleDir = join(pagesDirectory, locale)
			if (!isDirectory(secondaryLocaleDir)) continue
			await removeDirectory(secondaryLocaleDir)
		}
	}

	const pages = await getProjectPages(root, astroI18n.internals.config)

	for (const page of pages) {
		if (page.route === "/404") continue
		for (const locale of astroI18n.secondaryLocales) {
			const proxyRoute = astroI18n.l(page.route, undefined, {
				targetLocale: locale,
			})

			const proxy = await page.getProxy(proxyRoute, astroI18n)
			if (!proxy) continue

			await writeNestedFile(
				join(pagesDirectory, proxyRoute, "index.astro"),
				proxy,
			)
		}
	}
}

export default cmd

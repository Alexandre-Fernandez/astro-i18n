import AsyncNode from "@lib/async-node/classes/async-node.class"
import { toPosixPath } from "@lib/async-node/functions/path.functions"
import {
	isDirectory,
	removeDirectory,
	writeNestedFile,
} from "@lib/async-node/functions/fs.functions"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { Command, ParsedArgv } from "@lib/argv/types"

const cmd: Command = {
	name: "generate:pages",
	options: ["purge"],
}

export async function generatePages({ command, args, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const { join } = await AsyncNode.path

	const root = await toPosixPath(args[0] || process.cwd())
	if (!(await isDirectory(root))) {
		throw new RootNotFound(
			`Make sure that your root directory has an astro.config file and that ${PACKAGE_NAME} is in the package.json dependencies.`,
		)
	}
	const pagesDirectory = join(root, "src/pages")

	await astroI18n.initialize()

	if (options["purge"]) {
		for (const locale of astroI18n.secondaryLocales) {
			const secondaryLocaleDir = join(pagesDirectory, locale)
			if (!isDirectory(secondaryLocaleDir)) continue
			removeDirectory(secondaryLocaleDir)
		}
	}

	const pages = await getProjectPages(root, astroI18n.internals.config)
	for (const page of pages) {
		if (page.route === "/404") continue
		for (const locale of astroI18n.secondaryLocales) {
			const proxyRoute = astroI18n.l(page.route, undefined, {
				targetLocale: locale,
			})

			const proxy = await page.getProxy(proxyRoute)
			if (!proxy) continue

			await writeNestedFile(
				join(pagesDirectory, proxyRoute, "index.astro"),
				proxy,
			)
		}
	}
}

export default cmd

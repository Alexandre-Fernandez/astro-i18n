import { isDirectory } from "@lib/async-node/functions/fs.functions"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { getProjectPages } from "@src/core/page/functions/page.functions"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { Command, ParsedArgv } from "@lib/argv/types"

const cmd: Command = {
	name: "sync:pages",
	options: ["purge"],
}

export async function syncPages({ command, args }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const root = args[0] || process.cwd()
	if (!(await isDirectory(root))) {
		throw new RootNotFound(
			`Make sure that your root directory has an astro.config file and that ${PACKAGE_NAME} is in the package.json dependencies.`,
		)
	}
	await astroI18n.initialize()

	const pages = await getProjectPages(root, astroI18n.internals.config)
	for (const page of pages) {
		if (page.route === "/404") continue
		for (const locale of astroI18n.secondaryLocales) {
			const proxy = await page.getProxy(
				astroI18n.l(page.route, undefined, { targetLocale: locale }),
			)
			if (!proxy) continue
		}
	}
}

export default cmd

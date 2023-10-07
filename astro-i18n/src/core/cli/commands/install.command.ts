import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { isDirectory } from "@lib/async-node/functions/fs.functions"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { Command, ParsedArgv } from "@lib/argv/types"

const cmd = {
	name: "install",
	options: ["root"],
} as const satisfies Command

export async function install({ command, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()

	const root = await toPosixPath(
		typeof options["root"] === "string" ? options["root"] : process.cwd(),
	)
	if (!(await isDirectory(root))) throw new RootNotFound()

	await astroI18n.initialize()
}

export default cmd

import type { Command, ParsedArgv } from "@lib/argv/types"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"

const cmd: Command = {
	name: "sync:pages",
	options: [],
}

export function syncPages({ command }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	console.log(process.cwd())
}

export default cmd

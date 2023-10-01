#!/usr/bin/env node
import { parseArgv } from "@lib/argv"
import syncPagesCommand, {
	syncPages,
} from "@src/core/cli/commands/sync-pages.command"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"

const argv = parseArgv([syncPagesCommand])

const cli: Record<string, Function> = {
	[syncPagesCommand.name]: syncPages,
}

if (!argv.command || !cli[argv.command]) throw new InvalidCommand()

cli[argv.command]!(argv)

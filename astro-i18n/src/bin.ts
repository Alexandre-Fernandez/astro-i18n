#!/usr/bin/env node
import { parseArgv } from "@lib/argv"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import generatePagesCommand, {
	generatePages,
} from "@src/core/cli/commands/generate-pages.command"

const argv = parseArgv([generatePagesCommand])

const cli: Record<string, Function> = {
	[generatePagesCommand.name]: generatePages,
}

if (!argv.command || !cli[argv.command]) throw new InvalidCommand()

cli[argv.command]!(argv)

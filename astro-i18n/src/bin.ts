#!/usr/bin/env node
import { parseArgv } from "@lib/argv"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import generatePagesCommand, {
	generatePages,
} from "@src/core/cli/commands/generate-pages.command"
import generateTypesCommand, {
	generateTypes,
} from "@src/core/cli/commands/generate-types.command"

const argv = parseArgv([generatePagesCommand, generateTypesCommand])

const cli = {
	[generatePagesCommand.name]: generatePages,
	[generateTypesCommand.name]: generateTypes,
}

if (!argv.command || !cli[argv.command]) throw new InvalidCommand()

cli[argv.command]!(argv)

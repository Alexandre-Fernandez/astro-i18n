#!/usr/bin/env node
import { parseArgv } from "@lib/argv"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import generatePagesCommand, {
	generatePages,
} from "@src/core/cli/commands/generate-pages.command"
import generateTypesCommand, {
	generateTypes,
} from "@src/core/cli/commands/generate-types.command"
import extractCommand, {
	extract,
} from "@src/core/cli/commands/extract-keys.command"
import installCommand, { install } from "@src/core/cli/commands/install.command"

const argv = parseArgv([
	generatePagesCommand,
	generateTypesCommand,
	extractCommand,
	installCommand,
])

const cli = {
	[generatePagesCommand.name]: generatePages,
	[generateTypesCommand.name]: generateTypes,
	[extractCommand.name]: extract,
	[installCommand.name]: install,
}

if (!argv.command || !(cli as any)[argv.command]) {
	throw new InvalidCommand()
}

;(cli as any)[argv.command](argv)

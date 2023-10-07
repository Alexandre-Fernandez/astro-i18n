#!/usr/bin/env node
import { parseArgv } from "@lib/argv"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import generatePagesCommand, {
	generatePages,
} from "@src/core/cli/commands/generate-pages.command"
import generateTypesCommand, {
	generateTypes,
} from "@src/core/cli/commands/generate-types.command"
import extractKeysCommand, {
	extractKeys,
} from "@src/core/cli/commands/extract-keys.command"

const argv = parseArgv([
	generatePagesCommand,
	generateTypesCommand,
	extractKeysCommand,
])

const cli = {
	[generatePagesCommand.name]: generatePages,
	[generateTypesCommand.name]: generateTypes,
	[extractKeysCommand.name]: extractKeys,
}

if (!argv.command || !(cli as any)[argv.command]) {
	throw new InvalidCommand()
}

;(cli as any)[argv.command](argv)

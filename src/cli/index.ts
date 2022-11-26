#!/usr/bin/env node
import argv from "$lib/argv"
import { executeSync, sync } from "$src/cli/commands/sync"
import { executeInstall, install } from "$src/cli/commands/install"
import { executeSyncPages, syncPages } from "$src/cli/commands/sync.pages"
import { executeSyncTypes, syncTypes } from "$src/cli/commands/sync.types"
import { commandNotFound } from "$src/cli/errors"

const commands = {
	[install.name]: executeInstall,
	[sync.name]: executeSync,
	[syncPages.name]: executeSyncPages,
	[syncTypes.name]: executeSyncTypes,
}
const { command, args, options } = argv([sync, install])

if (commands[command]) commands[command](args, options)
else throw commandNotFound(commands)

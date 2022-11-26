import type { Command } from "./types"

const DEFAULT_COMMAND = "default"
const ARGUMENTS = "argv.main"

class Argv<Cmd extends Command> {
	node: string

	file: string

	command: Cmd["name"] = DEFAULT_COMMAND

	args: string[] = []

	options: { [key in Cmd["options"][number]["name"]]?: string[] } = {}

	#optionNames: {
		[command: string]: {
			[optionArg: string]: Cmd["options"][number]["name"]
		}
	} = {}

	constructor(commands: readonly Cmd[] = []) {
		const [node, file] = process.argv
		this.node = node ?? ""
		this.file = file ?? ""
		this.#fillOptions(commands)
		this.#init(
			process.argv.slice(2),
			commands.length === 1 && commands[0].name === DEFAULT_COMMAND,
		)
	}

	#fillOptions(commands: readonly Cmd[]) {
		for (const command of commands) {
			if (!this.#optionNames[command.name]) {
				this.#optionNames[command.name] = {}
			}

			for (const option of command.options) {
				// mapping each command option to its name
				this.#optionNames[command.name][`--${option.name}`] =
					option.name as any
				if (option.shortcut) {
					this.#optionNames[command.name][`-${option.shortcut}`] =
						option.name as any
				}
			}
		}
	}

	#init(args: string[], isDefault = false) {
		if (args.length === 0) return
		let rawArgs = args
		if (isDefault) {
			this.command = DEFAULT_COMMAND
		} else {
			this.command = args.at(0)!
			// removing command name from the raw arguments
			rawArgs = args.slice(1)
		}

		let currentOption: Cmd["options"][number]["name"] | typeof ARGUMENTS =
			ARGUMENTS
		for (const arg of rawArgs) {
			// checking if arg is an option, if it's not `option` will stay undefined
			let option = this.#optionNames[this.command][arg] as
				| Cmd["options"][number]["name"]
				| undefined

			if (!option) {
				// checking for unknown options
				if (arg.startsWith("--")) option = arg.replace("--", "") as any
				if (arg.startsWith("-")) option = arg.replace("-", "") as any
			} else {
				this.options[option] = []
				currentOption = option
				continue
			}

			if (currentOption === ARGUMENTS) {
				this.args.push(arg)
				continue
			}

			this.options[currentOption]?.push(arg)
		}
	}
}

/**
 * Parses `process.argv`.
 * @param commands If there is only one command, naming it `"default"` will
 * remove the need to use a sub-command in the CLI (e.g. `file arg1 arg2
 * --option1`, instead of, `file cmd arg1 arg2 --option1`).
 */
export default function argv<Cmd extends Command>(
	commands: readonly Cmd[] = [],
) {
	return new Argv<Cmd>(commands)
}

export { Command } from "./types"

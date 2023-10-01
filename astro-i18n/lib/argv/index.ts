import InvalidProcessArgv from "@lib/argv/error/invalid-process-argv.error"
import NoArgumentsFound from "@lib/argv/error/no-arguments-found.error"
import ProcessUndefined from "@lib/argv/error/process-undefined.error"
import type { Command, ParsedArgv } from "@lib/argv/types"

export function parseArgv(commands: Command[]) {
	if (!process || !process.argv) throw new ProcessUndefined()

	const [node, filename, ...params] = process.argv as string[]
	if (!node || !filename) throw new InvalidProcessArgv()
	if (params.length === 0) throw new NoArgumentsFound()

	const parsed: ParsedArgv = {
		node,
		filename,
		command: null as string | null,
		args: [] as string[],
		options: {} as { [name: string]: string | true },
	}

	let isParsingOptions = false
	for (const [i, current] of params.entries()) {
		// command
		if (i === 0) {
			if (!commands.some((cmd) => cmd.name === current)) return parsed
			parsed.command = current
			continue
		}
		// options
		if (current.startsWith("-") || isParsingOptions) {
			if (!current.startsWith("--")) return parsed
			isParsingOptions = true

			const options =
				commands.find((cmd) => cmd.name === parsed.command)?.options ||
				never()
			const cur = current.replace("--", "")

			const equalIndex = cur.indexOf("=")
			// no option value
			if (equalIndex < 0) {
				if (!options.includes(cur)) return parsed
				parsed.options[cur] = true
				continue
			}
			// parsing option value
			parsed.options[cur.slice(0, equalIndex)] = cur.slice(equalIndex + 1)
			continue
		}
		// arguments
		parsed.args.push(current)
	}

	return parsed
}

function never(): never {
	throw new Error("Unreachable code executed.")
}

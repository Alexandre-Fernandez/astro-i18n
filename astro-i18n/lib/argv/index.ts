import InvalidProcessArgv from "@lib/argv/error/invalid-process-argv.error"
import NoArgumentsFound from "@lib/argv/error/no-arguments-found.error"
import ProcessUndefined from "@lib/argv/error/process-undefined.error"

/**
 * @param name The CLI name, if this is not found as the first argument of
 * `process.argv`, it won't be parsed. For example in the following command:
 * `node ./cmd.cjs program arg --option`, the name would be `"program"`.
 * @param commands The commands and their corresponding options to know what we
 * need to parse.
 */
export function parseArgv(
	name: string,
	commands: { name: string; options: string[] }[],
) {
	if (!process || !process.argv) throw new ProcessUndefined()

	const [node, filename, ...params] = process.argv as string[]
	if (!node || !filename) throw new InvalidProcessArgv()
	if (params.length === 0) throw new NoArgumentsFound()

	const parsed = {
		node,
		filename,
		name: null as string | null,
		command: null as string | null,
		args: [] as string[],
		options: {} as { [name: string]: string | true },
	}

	let isParsingOptions = false
	for (const [i, current] of params.entries()) {
		// name
		if (i === 0) {
			if (current !== name) return parsed
			parsed.name = current
			continue
		}
		// command
		if (i === 1) {
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

import { PACKAGE_NAME } from "$src/constants"

export function noAstroRoot() {
	return new Error(`Cannot resolve astro's working directory.`)
}

export function astroRootNotFound(path: string) {
	return new Error(
		`Cannot resolve astro's working directory. \nMake sure that "${path}" exists.`,
	)
}

export function commandNotFound(
	commands: Record<string, (...args: any[]) => any>,
) {
	const cmds = Object.keys(commands).map((cmd) => `${PACKAGE_NAME} ${cmd}`)
	throw new Error(
		`Command not found, available commands : ${cmds.join("\n")}`,
	)
}

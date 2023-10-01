export type Command = { name: string; options: string[] }

export type ParsedArgv = {
	node: string
	filename: string
	command: string | null
	args: string[]
	options: { [name: string]: string | true }
}

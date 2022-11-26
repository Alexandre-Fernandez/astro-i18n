export type Command = {
	name: string
	options: readonly Option[]
}

type Option = {
	name: string
	shortcut?: string
}

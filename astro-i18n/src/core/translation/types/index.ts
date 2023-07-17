import type { ExecResult } from "@lib/regex"

export type Match = ExecResult

export type Matcher = (string: string) => Match | null

export type Formatter = (value: unknown, ...args: unknown[]) => unknown

export type FormatterMatch = { name: string; args: string[] }

export type VariantProperty = {
	name: string
	values: Primitive[]
}

export type Primitive = undefined | null | boolean | string | number

export type DeepStringRecord = {
	[key: string]: string | DeepStringRecord
}

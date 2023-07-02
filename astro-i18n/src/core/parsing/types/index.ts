import type { ExecResult } from "@lib/regex"
import type Interpolation from "@src/core/parsing/classes/interpolation.class"

export type Match = ExecResult

export type Matcher = (string: string) => Match | null

export type Formatter = (value: unknown) => unknown

export type InterpolationValue = {
	get: (
		options: Record<string, any>,
		formatters: Record<string, Formatter>,
	) => unknown
	vars: string[]
} | null

export type InterpolationFormatter = {
	name: string
	arguments: Interpolation[]
}

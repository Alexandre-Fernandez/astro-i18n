import type { ExecResult } from "@lib/regex"
import type Interpolation from "@src/core/parsing/classes/interpolation.class"
import type { InterpolationValueType } from "@src/core/parsing/enums/interpolation-value-type.enum"

export type Match = ExecResult

export type Matcher = (string: string) => Match | null

export type Formatter = (value: unknown) => unknown

/**
 * Split string InterpolationValue with type
 */
export type RawInterpolationValue = {
	type: InterpolationValueType
	value: Match["match"][0]
	end: Match["range"][1]
}

export type InterpolationValue = {
	raw: string
	type: InterpolationValueType
	get: (
		props: Record<string, any>,
		formatters: Record<string, Formatter>,
	) => unknown
}

export type InterpolationFormatter = {
	name: string
	arguments: Interpolation[]
}

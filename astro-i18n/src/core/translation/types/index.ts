import type { ExecResult } from "@lib/regex"
import type Variant from "@src/core/translation/classes/variant.class"

export type Match = ExecResult

export type Matcher = (string: string) => Match | null

export type FormatterMatch = { name: string; args: string[] }

export type Formatter = (value: unknown, ...args: unknown[]) => unknown

export type Formatters = Record<string, Formatter>

export type VariantProperty = {
	name: string
	values: Primitive[]
}

export type Primitive = undefined | null | boolean | string | number

export type DeepStringRecord = {
	[key: string]: string | DeepStringRecord
}

export type TranslationMap = {
	[group: string]: {
		[locale: string]: ComputedTranslations
	}
}

export type ComputedTranslations = {
	[key: string]: {
		default?: string
		variants: Variant[]
	}
}

export type LoadDirectives = {
	[route: string]: string[]
}

export type TranslationProperties = Record<string, unknown>

export type VariantProperties = {
	raw?: string
	priority?: number
	properties?: VariantProperty[]
	value?: string
}

export type SerializedTranslationMap = {
	[group: string]: {
		[locale: string]: SerializedComputedTranslations
	}
}

type SerializedComputedTranslations = {
	[key: string]: {
		default?: string
		variants: Required<VariantProperties>[]
	}
}

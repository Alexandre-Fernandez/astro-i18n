import type { ExecResult } from "@lib/regex"
import type Variant from "@src/core/translation/classes/variant.class"

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

export type TranslationBank = {
	[namespace: string]: {
		[locale: string]: ComputedTranslations
	}
}

export type ComputedTranslations = {
	[key: string]: {
		default?: string
		variants: Variant[]
	}
}

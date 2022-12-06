import type { getPagesMetadata } from "$src/core/fs"
import type { Primitive } from "$src/types/javascript"

export type PageInfo = {
	name: string
	route: string
	path: string
	hasGetStaticPaths: boolean
}

export type PagesMetadata = ReturnType<typeof getPagesMetadata>

export type ParsedInterpolation = {
	name: string
	default: Primitive | undefined
	formatters: ParsedFormatter[]
	range: [number, number]
}

export type ParsedFormatter = {
	name: string
	arguments: InterpolationArgument[]
}

export type InterpolationFormatter = (
	value: unknown,
	...args: ReturnType<InterpolationArgument["getter"]>[]
) => string

export type InterpolationArgument = {
	getter: (options: TranslationOptions[string]) => unknown
	name?: string
}

export type TranslationKey = {
	name: string // variant less name // mykey
	variant: TranslationVariant
}

export type TranslationVariant = {
	name: string // full name // mykey{variant: 0}
	properties: VariantProperty[]
}

export type VariantProperty = {
	name: string
	value: number | string
}

export type Imports = {
	[source: string]: {
		[namedImport: string]: /* namedImportAlias */ string
		default?: string
	}
}

export type FullRouteTranslationMap = {
	[langCode: string]: {
		[untranslated: string]: {
			[otherLangCode: string]: string
		}
	}
}

export type CodeFormat = "ESM" | "CJS"

// overridden by generators (for `l` and `t` functions)

export type RouteUri = string

export type RouteParams = {
	[key: string]: undefined | Record<string, string>
}

export type TranslationPath = string

export type TranslationOptions = {
	[key: string]: undefined | Record<string, string | number | unknown>
}

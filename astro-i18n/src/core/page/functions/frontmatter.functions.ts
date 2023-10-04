import type {
	GetStaticPathsItem,
	GetStaticPathsProps,
} from "@src/core/astro/types"

export function createGetStaticPaths(
	callback: (
		props: GetStaticPathsProps & {
			astroI18n: {
				locale: string
				route: string
				primaryLocale: string
				secondaryLocales: string
				fallbackLocale: string
			}
		},
	) => GetStaticPathsItem[] | Promise<GetStaticPathsItem[]>,
) {
	return async (
		props: GetStaticPathsProps & { langCode: string | undefined },
	) => {
		if (props.langCode) return callback(props)
		return callback({
			...props,
			langCode: extractRouteLangCode(importMetaUrl),
		})

		// to-do: if nothing in props then it's default locale
		// atleast we can give current locale
		// also we can modify singleton instead of using props
	}
}

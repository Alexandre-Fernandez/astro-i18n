export {}
// import type {
// 	GetStaticPathsItem,
// 	GetStaticPathsProps,
// } from "@src/core/astro/types"

// export function createGetStaticPaths(
// 	callback: (
// 		props: GetStaticPathsProps & {
// 			astroI18n: {
// 				locale: string
// 				route: string
// 				primaryLocale: string
// 				secondaryLocales: string
// 				fallbackLocale: string
// 			}
// 		},
// 	) => GetStaticPathsItem[] | Promise<GetStaticPathsItem[]>,
// ) {
// 	return async (
// 		props: GetStaticPathsProps & { langCode: string | undefined },
// 	) => {
// 		if (props.langCode) return callback(props)
// 		return callback({
// 			...props,
// 			langCode: extractRouteLangCode(importMetaUrl),
// 		})
// 	}
// }

// createGetStaticPaths(({ astroI18n: { locale } }) => {
// 	return [
// 		{
// 			params: {
// 				locale,
// 			},
// 			props: {
// 				none: "",
// 			},
// 		},
// 	]
// })

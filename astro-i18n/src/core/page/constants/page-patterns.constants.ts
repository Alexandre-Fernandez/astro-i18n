import { Regex } from "@lib/regex"

export const ASTRO_COMPONENT_ROUTE_NAME_PATTERN = new Regex(
	/(\/[^\s/]+)?(\/[^\s/]+)\.astro$/,
)

export const FRONTMATTER_PATTERN = new Regex(/^---\n([\S\s]+)\n---\n/)

export const PRERENDER_EXPORT_PATTERN = new Regex(
	/export\s*(?:const\s+prerender|var\s+prerender|let\s+prerender)|export\s*?{\s*?prerender\s*?}/,
)

export const GET_STATIC_PATHS_EXPORT_PATTERN = new Regex(
	/export\s+(?:async\s+)?(?:function\s+|const\s+|var\s+|let\s+)getStaticPaths|export\s*{\s*getStaticPaths\s*}/,
)

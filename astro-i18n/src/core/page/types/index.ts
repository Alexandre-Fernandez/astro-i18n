import type { DeepStringRecord } from "@src/core/translation/types"

export interface PageProps {
	name: string
	route: string
	path: string
	translations: {
		[locale: string]: DeepStringRecord
	}
	routes: {
		[secondaryLocale: string]: {
			[segment: string]: string
		}
	}
}

import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type {
	GetStaticPathsItem,
	GetStaticPathsProps,
} from "@src/core/astro/types"

/**
 * Workaround function to make astroI18n work inside getStaticPaths.
 * This is because Astro's getStaticPaths runs before everything which doesn't
 * allows astroI18n to update its state automatically.
 */
export function createGetStaticPaths(
	callback: (
		props: GetStaticPathsProps,
	) => GetStaticPathsItem[] | Promise<GetStaticPathsItem[]>,
) {
	return async (
		props: GetStaticPathsProps & {
			astroI18n?: {
				locale: string
			}
		},
	) => {
		if (!astroI18n.isInitialized) {
			await astroI18n.internals.waitInitialization()
		}
		astroI18n.internals.setPrivateProperties({
			isGetStaticPaths: true,
			locale: props.astroI18n
				? props.astroI18n.locale
				: astroI18n.primaryLocale,
			route: "",
			// because getStaticPaths runs before the middleware and because the
			// runned code is bundled in a js chunk (import.meta.url won't work)
			// we cannot know the route
		})
		return callback(props)
	}
}

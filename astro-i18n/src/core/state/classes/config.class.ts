import type { ConfigRoutes, ConfigTranslations } from "@src/core/state/types"

class Config {
	primaryLocale = "en"

	secondaryLocales: string[] = []

	showPrimaryLocale = false

	trailingSlash: "always" | "never" = "never"

	support: "server" | "client+server" = "client+server"

	translations: ConfigTranslations = {}

	routes: ConfigRoutes = {}
}

export default Config

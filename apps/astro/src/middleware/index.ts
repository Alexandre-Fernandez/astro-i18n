import { useAstroI18n } from "astro-i18n"

export const onRequest = useAstroI18n(
	{},
	{
		test: (value) => {
			console.log(value)
			return value
		},
	},
)

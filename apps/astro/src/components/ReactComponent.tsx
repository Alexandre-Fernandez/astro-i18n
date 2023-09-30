import { astroI18n } from "astro-i18n"

export default function ReactComponent() {
	return <p>{astroI18n.t("commonBasic")}</p>
}

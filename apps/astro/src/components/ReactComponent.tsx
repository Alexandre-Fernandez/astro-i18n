import { astroI18n, getSingleton, setSingleton } from "astro-i18n"

export default function ReactComponent() {
	setSingleton()

	astroI18n

	return <p>React Component {getSingleton()}</p>
}

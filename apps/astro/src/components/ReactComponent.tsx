import { getSingleton, setSingleton } from "astro-i18n"

export default function ReactComponent() {
	setSingleton()

	return <p>React Component {getSingleton()}</p>
}

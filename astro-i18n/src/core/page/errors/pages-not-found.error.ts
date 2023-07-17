import { PAGES_DIRNAME } from "@src/constants/app.constants"

class PagesNotFound extends Error {
	constructor() {
		super(`Could not find astro "${PAGES_DIRNAME}" directory.`)
	}
}

export default PagesNotFound

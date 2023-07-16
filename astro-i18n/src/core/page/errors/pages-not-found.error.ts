class PagesNotFound extends Error {
	constructor() {
		super('Could not find astro "pages" directory.')
	}
}

export default PagesNotFound

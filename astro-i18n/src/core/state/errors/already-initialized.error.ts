class AlreadyInitialized extends Error {
	constructor() {
		super("Cannot initialize astro-i18n, it already has been initialized.")
	}
}

export default AlreadyInitialized

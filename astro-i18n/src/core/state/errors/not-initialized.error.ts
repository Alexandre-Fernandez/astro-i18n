class NotInitialized extends Error {
	constructor() {
		super("Cannot perform operation, astro-i18n is not initialized.")
	}
}

export default NotInitialized

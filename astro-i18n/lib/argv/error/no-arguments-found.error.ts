class NoArgumentsFound extends Error {
	constructor() {
		super("No CLI arguments were found.")
	}
}

export default NoArgumentsFound

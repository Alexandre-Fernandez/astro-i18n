class InvalidProcessArgv extends Error {
	constructor() {
		super("An unexpected format of `process.argv` was found.")
	}
}

export default InvalidProcessArgv

class InvalidCommand extends Error {
	constructor() {
		super(`Invalid command.`)
	}
}

export default InvalidCommand

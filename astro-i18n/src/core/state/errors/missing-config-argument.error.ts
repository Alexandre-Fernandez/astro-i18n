class MissingConfigArgument extends Error {
	constructor() {
		super(
			`A config must be provided when not in a node or a browser environment.`,
		)
	}
}

export default MissingConfigArgument

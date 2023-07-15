class RootNotFound extends Error {
	constructor() {
		super(`Unable to find project root.`)
	}
}

export default RootNotFound

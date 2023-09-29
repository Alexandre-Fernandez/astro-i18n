class SerializedStateNotFound extends Error {
	constructor() {
		super("Could not find serialized state in the DOM.")
	}
}

export default SerializedStateNotFound

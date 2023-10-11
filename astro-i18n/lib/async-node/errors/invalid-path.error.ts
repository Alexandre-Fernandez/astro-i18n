class InvalidPath extends Error {
	constructor(path?: string) {
		super(path ? `Invalid path (${path}).` : "Invalid path.")
	}
}

export default InvalidPath

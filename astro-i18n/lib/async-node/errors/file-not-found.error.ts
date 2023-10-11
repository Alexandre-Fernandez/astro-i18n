class FileNotFound extends Error {
	constructor(path?: string) {
		super(
			path
				? `No file was found for the given path (${path}).`
				: "No file was found for the given path.",
		)
	}
}

export default FileNotFound

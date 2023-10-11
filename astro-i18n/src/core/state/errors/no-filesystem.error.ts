class NoFilesystem extends Error {
	constructor(message?: string) {
		super(
			message
				? `Cannot use filesystem: ${message}`
				: "Cannot use filesystem.",
		)
	}
}

export default NoFilesystem

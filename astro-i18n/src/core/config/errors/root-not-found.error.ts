class RootNotFound extends Error {
	constructor(instructions?: string) {
		super(
			instructions
				? `Unable to find project root. ${instructions}`
				: "Unable to find project root.",
		)
	}
}

export default RootNotFound

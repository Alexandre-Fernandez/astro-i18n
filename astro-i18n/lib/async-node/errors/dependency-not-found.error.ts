class DependencyNotFound extends Error {
	constructor(dependency?: string) {
		super(
			dependency
				? `Peer dependency \`${dependency}\` was not found, if it's not already done try installing it.`
				: "A dependency was not found.",
		)
	}
}

export default DependencyNotFound

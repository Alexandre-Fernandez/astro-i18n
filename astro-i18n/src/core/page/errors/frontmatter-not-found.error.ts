class FrontmatterNotFound extends Error {
	constructor(path?: string) {
		super(
			path
				? `Component's frontmatter not found (${path}).`
				: "Component frontmatter not found.",
		)
	}
}

export default FrontmatterNotFound

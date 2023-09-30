class ProcessUndefined extends Error {
	constructor() {
		super("`process` global is undefined.")
	}
}

export default ProcessUndefined

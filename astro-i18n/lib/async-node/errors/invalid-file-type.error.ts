class InvalidFileType extends Error {
	constructor(supportedFormats: string[] = []) {
		super(
			supportedFormats.length > 0
				? `Invalid file type, supported formats are: "${supportedFormats.join(
						'", "',
				  )}"`
				: "Invalid file type, format not supported.",
		)
	}
}

export default InvalidFileType

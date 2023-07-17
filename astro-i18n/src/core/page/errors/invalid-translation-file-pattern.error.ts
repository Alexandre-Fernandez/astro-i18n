import { Regex } from "@lib/regex"

class InvalidTranslationFilePattern extends Error {
	constructor(pattern?: Regex) {
		super(
			pattern
				? `Invalid pattern (${pattern.source}) given, the pattern should match the route name at index 1 (optional), the route locale at index 2 and the translated name at index 3 (optional).`
				: "Invalid pattern given, the pattern should match the route name at index 1 (optional), the route locale at index 2 and the translated name at index 3 (optional).",
		)
	}
}

export default InvalidTranslationFilePattern

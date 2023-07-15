import Environment from "@src/core/state/enums/environment.enum"

class AstroI18n {
	environment: Environment

	constructor() {
		this.environment = AstroI18n.#detectEnvironment()
	}

	static #detectEnvironment() {
		if (
			typeof process === "object" &&
			typeof process.versions === "object" &&
			typeof process.versions.node !== "undefined"
		) {
			return Environment.NODE
		}

		if (typeof window !== "undefined") {
			return Environment.BROWSER
		}

		return Environment.NONE
	}
}

export default AstroI18n

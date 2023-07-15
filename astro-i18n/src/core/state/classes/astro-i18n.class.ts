import Config from "@src/core/state/classes/config.class"
import Environment from "@src/core/state/enums/environment.enum"

class AstroI18n {
	environment: Environment

	#config = new Config()

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

	toHtml() {
		return `<script type="text/json"></script>`
	}
}

export default AstroI18n

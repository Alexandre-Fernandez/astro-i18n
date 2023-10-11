import Regex from "@lib/regex/classes/regex.class"

class RegexBuilder {
	#source: string

	#flags: string

	constructor({ source, flags }: RegExp) {
		this.#source = source
		this.#flags = flags
	}

	static fromRegex(regex: Regex) {
		return new RegexBuilder(regex.regexp)
	}

	appendPattern(pattern: string) {
		this.#source = `${this.#source}${pattern}`

		return this
	}

	matchTrimifiable() {
		this.#source = `\\s*${this.#source}\\s*`

		return this
	}

	assertStarting() {
		this.#source = `^${this.#source}`

		return this
	}

	assertEnding() {
		this.#source = `${this.#source}$`

		return this
	}

	addGroup() {
		this.#source = `(${this.#source})`

		return this
	}

	addGlobalFlag() {
		if (!this.#flags.includes("g")) {
			this.#flags = `${this.#flags}g`
		}

		return this
	}

	build() {
		return new Regex(new RegExp(this.#source, this.#flags))
	}
}

export default RegexBuilder

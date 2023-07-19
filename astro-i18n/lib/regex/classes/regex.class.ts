import type { ExecResult } from "@lib/regex/types"

class Regex {
	static readonly BREAK = "break"

	regexp: RegExp

	constructor(regexp: RegExp) {
		this.regexp = new RegExp(regexp.source, regexp.flags)
	}

	static fromString(source: string, flags?: string) {
		return new Regex(new RegExp(source, flags))
	}

	get source() {
		return this.regexp.source
	}

	get flags() {
		return this.regexp.flags
	}

	add(regexp: RegExp) {
		this.regexp = new RegExp(
			`${this.regexp.source}${regexp.source}`,
			this.regexp.flags,
		)

		return this
	}

	test(string: string) {
		return this.regexp.test(string)
	}

	exec(string: string, callback: (match: ExecResult) => unknown) {
		const iterator = this.#iterateExec(string)

		let current = iterator.next()

		while (!current.done) {
			const result = callback(current.value)
			if (result === Regex.BREAK) break
			current = iterator.next()
		}

		return this
	}

	match(string: string): ExecResult | null {
		let result: ExecResult | null = null

		this.exec(string, (match) => {
			result = match
			return Regex.BREAK
		})

		return result
	}

	clone() {
		return new Regex(new RegExp(this.regexp.source, this.regexp.flags))
	}

	toMatcher() {
		return this.match.bind(this)
	}

	*#iterateExec(string: string): Generator<ExecResult, undefined, unknown> {
		let globalRegexp = this.regexp
		if (!this.regexp.flags.includes("g")) {
			globalRegexp = new RegExp(
				this.regexp.source,
				`${this.regexp.flags}g`,
			)
		}

		let match: RegExpExecArray | null = globalRegexp.exec(string)

		while (match !== null) {
			if (match) {
				yield {
					range: [match.index, match.index + match[0].length],
					match: [...match],
				}
			}
			match = this.regexp.exec(string)
		}
	}
}

export default Regex

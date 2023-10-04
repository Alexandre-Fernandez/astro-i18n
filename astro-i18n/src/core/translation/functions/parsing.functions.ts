import { never } from "@lib/error"
import { CALLBACK_BREAK } from "@src/constants/app.constants"

/**
 * Traverses a `string` taking the object/array/string depth into account.
 * For example if you are inside curly brackets `depth` will be `1`. Expanding
 * on that example, if you additionally are inside array brackets `depth` will
 * be `2`, and so on.
 */
export function depthAwareforEach(
	string: string,
	callback: (
		char: string,
		i: number,
		depth: number,
		isOpening: boolean,
		isClosing: boolean,
	) => unknown,
) {
	let depth = 0
	let isString = false
	let quoteType = null as string | null
	// eslint-disable-next-line unicorn/no-for-loop
	for (let i = 0; i < string.length; i += 1) {
		const char = string[i] || never()
		const isQuote = char === '"' || char === "'" || char === "`"

		let isOpening = false
		let isClosing = false

		if (char === "{" || char === "[") {
			depth += 1
			isOpening = true
		} else if (char === "}" || char === "]") {
			depth -= 1
			isClosing = true
		} else if (!isString && isQuote) {
			depth += 1
			isString = true
			quoteType = char
			isOpening = true
		} else if (isString && char === quoteType) {
			depth -= 1
			isString = false
			quoteType = null
			isClosing = true
		}

		const isBreak =
			callback(char, i, depth, isOpening, isClosing) === CALLBACK_BREAK
		if (isBreak) break
	}
}

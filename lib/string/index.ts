/**
 * @returns The rest of the `string` after `searchString`.
 */
export function getStringAfter(string: string, searchString: string) {
	const index = string.indexOf(searchString)
	if (index < 0) return string
	return string.slice(index + searchString.length)
}

/**
 * Splits the given `string` in two.
 */
export function splitAt(
	string: string,
	index: number,
	deleteIndex = false,
): [string, string] {
	return [string.slice(0, index), string.slice(index + Number(deleteIndex))]
}

/**
 * If `searchString` is found in `string`, splits `string` in two at the end of
 * `searchString`, else returns `["", string]`.
 */
export function splitAfter(
	string: string,
	searchString: string,
): [string, string] {
	const index = string.indexOf(searchString)
	if (index < 0) return ["", string]
	return splitAt(string, index + searchString.length)
}

/**
 * Concatenates `string1` and `string2` with `glue` in the middle, if `string1`
 * ends with `glue` it gets removed, the same goes for the beginning of `string2`.
 */
// eslint-disable-next-line no-shadow
export function glue(string1: string, glue: string, string2: string) {
	const start = string1.endsWith(glue)
		? string1.slice(0, -glue.length)
		: string1
	const end = string2.startsWith(glue) ? string2.slice(glue.length) : string2
	return `${start}${glue}${end}`
}

/**
 * Removes `searchString` from `string` if it starts at the first index, else
 * returns `string`.
 */
export function removeFromStart(string: string, searchString: string) {
	if (string.startsWith(searchString)) {
		return string.slice(searchString.length)
	}
	return string
}

/**
 * Removes `searchString` from `string` if it ends at the last index, else
 * returns `string`.
 */
export function removeFromEnd(string: string, searchString: string) {
	if (string.endsWith(searchString)) {
		return string.slice(0, -searchString.length)
	}
	return string
}

/**
 * Adds `start` at the start of the `string` if it doesn't already start with
 * `start`.
 */
export function makeStartWith(string: string, start: string) {
	if (string.startsWith(start)) return string
	return `${start}${string}`
}

/**
 * Adds `end` at the end of the `string` if it doesn't already end with
 * `end`.
 */
export function makeEndWith(string: string, end: string) {
	if (string.endsWith(end)) return string
	return `${string}${end}`
}

export function execOnce(regex: RegExp, string: string) {
	const match = regex.exec(string)
	if (!match) return null
	const out = {
		range: [match.index, match.index + match[0].length],
		match: [...match],
	}
	regex.lastIndex = 0
	return out
}

export function replaceRange(
	string: string,
	start: number,
	end: number,
	value: string,
) {
	return `${string.slice(0, start)}${value}${string.slice(end)}`
}

/**
 * @returns The results of running `regex.exec` on `string`.
 */
export function getExecs(regex: RegExp, string: string) {
	if (!regex.flags.includes("g")) {
		throw new Error(
			`Cannot exec over \`/${regex.source}/\` without the "g" flag.`,
		)
	}
	const execs: { range: [number, number]; match: string[] }[] = []

	let match: RegExpExecArray | null | undefined
	while (match !== null) {
		if (match?.index !== undefined) {
			execs.push({
				range: [match.index, match.index + match[0].length],
				match: [...match],
			})
		}
		match = regex.exec(string)
	}

	return execs
}

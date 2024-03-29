import UnreachableCode from "@src/errors/unreachable-code.error"

export function never(): never {
	throw new UnreachableCode()
}

export function throwError(error = new Error("Something went wrong.")): never {
	throw error
}

export function throwFalsy(): never {
	throw new TypeError(
		`Expected a truthy value, found a falsy one (false, NaN, 0, undefined, null or "").`,
	)
}

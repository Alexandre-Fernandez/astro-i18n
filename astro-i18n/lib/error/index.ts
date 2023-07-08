export function throwError(error = new Error("Something went wrong.")): never {
	throw error
}

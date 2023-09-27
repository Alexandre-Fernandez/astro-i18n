/**
 * Similar to `Array.prototype.map` but replaces items on the same array instead
 * of returning a new one.
 */
export function replace<T>(
	callback: (value: T, index: number, array: T[]) => unknown,
	array: T[],
) {
	for (let i = 0; i < array.length; i += 1) {
		array[i] = callback(array[i] as T, i, array) as T
	}

	return array
}

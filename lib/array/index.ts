/**
 * Returns a shallow copy of `array` without the item at `index`.
 */
export function removeAt(array: unknown[], index: number) {
	return [...array.slice(0, index), ...array.slice(index + 1)]
}

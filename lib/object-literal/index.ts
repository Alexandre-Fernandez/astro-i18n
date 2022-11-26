import { isObjectLiteral, objectEntries } from "$lib/typescript-helpers"

/**
 * Nests a `value` in `object` following the `path` (array of keys).
 * - If a key doesn't exist it will be created as an object literal.
 * - If a key already exist and is not an object literal the function will stop
 * - If a value already exist for the given `keys` it will be replaced
 */
export function addNestedProperty(
	object: Record<string, unknown>,
	path: string[],
	value: unknown,
) {
	let prev = object as Record<string, any>

	for (const [i, key] of path.entries()) {
		if (i === path.length - 1) {
			prev[key] = value
			break
		}
		if (!hasOwnProperty(prev, key)) {
			prev[key] = {}
			prev = prev[key]
			continue
		}
		// prev[key] already exists
		if (Object.getPrototypeOf(prev[key]) === Object.prototype) {
			prev = prev[key]
			continue
		}
		break
	}
}

/**
 * Merges `object` into `base`.
 * @param options Properties :
 * - `mode`, `"fill"` will only merge when the property doesn't exist in `base`,
 * `"replace"` will replace it. Default = `"replace"`.
 * - `modifyBase`, if set to true it will merge by reference else it will deep
 * clone `base` first. Default = `true`.
 * @returns The new merged object.
 */
export function merge(
	base: Record<string, unknown>,
	object: Record<string, unknown>,
	options?: Partial<{
		mode: "fill" | "replace"
		modifyBase: boolean
	}>,
) {
	const { mode, modifyBase }: NonNullable<typeof options> = {
		mode: "replace",
		modifyBase: true,
		...options,
	}
	const merged = modifyBase ? base : clone(base)

	for (const [key, objectValue] of objectEntries(object)) {
		const baseValue = merged[key]
		if (hasOwnProperty(merged, key)) {
			if (isObjectLiteral(baseValue) && isObjectLiteral(objectValue)) {
				merge(baseValue, objectValue)
			} else if (mode === "replace") {
				// only replace when both are not objects
				merged[key] = object[key]
			}
			continue
		}
		merged[key] = object[key]
	}
	return merged
}

/**
 * @returns A deep cloned `object`, works with any value.
 */
export function clone<T>(object: T): T {
	if (!object || typeof object !== "object") return object
	if (Array.isArray(object)) {
		return object.map((item: any) => {
			if (typeof item === "object") return clone(item)
			return item
		}) as T
	}
	return objectEntries(object as any).reduce((cloned, [key, value]) => {
		;(cloned as any)[key] = clone(value)
		return cloned
	}, {} as T)
}

/**
 * Determines whether an `object` has a property with the specified `name`.
 */
export function hasOwnProperty(object: object, name: string) {
	return Object.prototype.hasOwnProperty.call(object, name)
}

/**
 * Merges `object` into `base`
 * @param options.mode `"fill"` merges when the property doesn't exist,
 * `"replace"` replaces duplicate properties, default `"replace"`.
 * @param options.mutable `base` will be modified when `true`, otherwise the
 * modifications will happen on a deep clone, default `true`.
 * @returns `undefined` unless when `options.mutable` is set to true.
 */
export function merge(
	base: Record<string, unknown>,
	object: Record<string, unknown>,
	options?: Partial<{
		mode: "fill" | "replace"
		mutable: boolean
	}>,
) {
	const { mode, mutable }: NonNullable<typeof options> = {
		mode: "replace",
		mutable: true,
		...options,
	}
	const merged = mutable ? base : structuredClone(base)

	for (const [key, objectValue] of Object.entries(object)) {
		const baseValue = merged[key]
		if (Object.hasOwn(merged, key)) {
			if (isRecord(baseValue) && isRecord(objectValue)) {
				merge(baseValue, objectValue)
			} else if (mode === "replace") {
				// only replace when both are not objects
				merged[key] = object[key]
			}
			continue
		}
		merged[key] = object[key]
	}

	return mutable ? undefined : merged
}

function isRecord(record: unknown): record is Record<string, unknown> {
	return Object.getPrototypeOf(record) === Object.prototype
}
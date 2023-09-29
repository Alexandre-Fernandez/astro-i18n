import { isArray, isObject } from "@lib/ts/guards"
import type {
	ComputedTranslations,
	TranslationMap,
	VariantProperties,
	VariantProperty,
} from "@src/core/translation/types"

export function isTranslationMap(
	translationMap: unknown,
): translationMap is TranslationMap {
	if (!isObject(translationMap)) return false

	for (const groupLocales of Object.values(translationMap)) {
		if (!isObject(groupLocales)) return false

		for (const computedTranslations of Object.values(groupLocales)) {
			if (!isComputedTranslations(computedTranslations)) return false
		}
	}

	return true
}

function isComputedTranslations(
	computedTranslations: unknown,
): computedTranslations is ComputedTranslations {
	if (!isObject(computedTranslations)) return false

	for (const computedTranslation of Object.values(computedTranslations)) {
		if (!isObject(computedTranslation)) return false

		for (const [key, value] of Object.entries(computedTranslation)) {
			switch (key) {
				case "default": {
					if (typeof value !== "string") return false
					break
				}
				case "variants": {
					if (!isArray(value)) return false
					if (!value.every((variant) => isVariantObject(variant))) {
						return false
					}
					break
				}
				default: {
					return false
				}
			}
		}
	}

	return true
}

function isVariantObject(
	variant: unknown,
): variant is Required<VariantProperties> {
	if (!isObject(variant)) return false

	const entries = Object.entries(variant)
	if (entries.length < 4) return false

	for (const [key, value] of entries) {
		switch (key) {
			case "raw": {
				if (typeof value !== "string") return false
				break
			}
			case "priority": {
				if (typeof value !== "number") return false
				break
			}
			case "properties": {
				if (!isArray(value)) return false
				if (!value.every((property) => isVariantProperty(property))) {
					return false
				}
				break
			}
			case "value": {
				if (typeof value !== "string") return false
				break
			}
			default: {
				return false
			}
		}
	}

	return true
}

function isVariantProperty(
	variantProperty: unknown,
): variantProperty is VariantProperty {
	if (!isObject(variantProperty)) return false

	const entries = Object.entries(variantProperty)
	if (entries.length < 2) return false

	for (const [key, value] of entries) {
		switch (key) {
			case "name": {
				if (typeof value !== "string") return false
				break
			}
			case "values": {
				if (!isArray(value)) return false
				if (
					!value.every((val) => {
						return (
							typeof val === "boolean" ||
							typeof val === "string" ||
							typeof val === "number" ||
							val == null
						)
					})
				) {
					return false
				}
				break
			}
			default: {
				return false
			}
		}
	}

	return true
}

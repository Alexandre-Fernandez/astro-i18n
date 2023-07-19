import { VARIANT_PATTERN } from "@src/constants/patterns.constants"
import Variant from "@src/core/translation/classes/variant.class"
import NonStringVariant from "@src/core/translation/errors/non-string-variant.error"
import type {
	ComputedTranslations,
	DeepStringRecord,
} from "@src/core/translation/types"

/*
	{
		[key: string]: string | DeepStringRecord;
	}
		====>
	{
		[key: string]: {
			default?: string
			variants: Variant[]
		}
	}
*/
export function computeDeepStringRecord(
	deepStringRecord: DeepStringRecord,
	path = "",
	computed: ComputedTranslations = {},
) {
	for (const [curKey, curValue] of Object.entries(deepStringRecord)) {
		if (typeof curValue === "string") {
			const { match, range } = VARIANT_PATTERN.match(curKey) || {}
			// no variant => default
			if (!match?.[1] || !range) {
				const key = `${path}.${curKey}`.replace(/^\./, "")

				if (computed[key]) {
					computed[key]!.default = curValue
					continue
				}
				computed[key] = {
					default: curValue,
					variants: [],
				}
				continue
			}
			// variant
			const key = `${path}.${
				curKey.slice(0, range[0]) + curKey.slice(range[1])
			}`.replace(/^\./, "")

			if (computed[key]) {
				computed[key]!.variants.push(new Variant(match[1], curValue))
				continue
			}
			computed[key] = {
				variants: [new Variant(match[1], curValue)],
			}
			continue
		}

		if (VARIANT_PATTERN.test(curKey)) throw new NonStringVariant()

		computeDeepStringRecord(
			curValue,
			`${path}.${curKey}`.replace(/^\./, ""),
			computed,
		)
	}

	return computed
}

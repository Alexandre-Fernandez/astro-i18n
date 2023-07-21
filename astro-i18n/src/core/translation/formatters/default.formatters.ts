/* eslint-disable camelcase */
import InvalidFormatterParam from "@src/core/translation/errors/formatters/invalid-formatter-param.error"
import type { Formatters } from "@src/core/translation/types"

export default {
	nullish(value, defaultValue) {
		if (defaultValue == null) {
			throw new InvalidFormatterParam(
				`nullish default value must not be undefined or null, found ${defaultValue}.`,
			)
		}
		return value == null ? defaultValue : value
	},
	falsy(value, defaultValue) {
		if (!defaultValue) {
			throw new InvalidFormatterParam(
				`falsy default value must not be false, NaN, 0, undefined, null or "", found ${defaultValue}.`,
			)
		}
		return value || defaultValue
	},
	non_string(value, defaultValue) {
		if (typeof defaultValue !== "string") {
			throw new InvalidFormatterParam(
				`non_string default value must be a string, found ${defaultValue}.`,
			)
		}
		return typeof value === "string" ? value : defaultValue
	},
} as Formatters

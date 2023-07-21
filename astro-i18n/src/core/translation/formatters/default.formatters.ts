/* eslint-disable camelcase */
import InvalidFormatterParam from "@src/core/translation/errors/formatters/invalid-formatter-param.error"
import InvalidFormatterValue from "@src/core/translation/errors/formatters/invalid-formatter-value.error copy"
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
	upper(value) {
		if (typeof value !== "string") {
			throw new InvalidFormatterValue(`Received value is not a string.`)
		}
		return value.toUpperCase()
	},
	lower(value) {
		if (typeof value !== "string") {
			throw new InvalidFormatterValue(`Received value is not a string.`)
		}
		return value.toLowerCase()
	},
	capitalize(value) {
		if (typeof value !== "string") {
			throw new InvalidFormatterValue(`Received value is not a string.`)
		}
		return `${value.slice(0, 1).toUpperCase()}${value
			.slice(1)
			.toLowerCase()}`
	},
	format_number() {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
	},
	format_currency() {
		//
	},
	format_date() {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
	},
} as Formatters

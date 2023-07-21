/* eslint-disable camelcase */
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import InvalidDate from "@src/core/translation/errors/formatters/invalid-date.error"
import InvalidFormatterParam from "@src/core/translation/errors/formatters/invalid-formatter-param.error"
import InvalidFormatterValue from "@src/core/translation/errors/formatters/invalid-formatter-value.error copy"
import type { Formatters } from "@src/core/translation/types"

export default {
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

	default_nullish(value, defaultValue) {
		if (defaultValue == null) {
			throw new InvalidFormatterParam(
				`default_nullish defaultValue must not be undefined or null, found ${defaultValue}.`,
			)
		}
		return value == null ? defaultValue : value
	},

	default_falsy(value, defaultValue) {
		if (!defaultValue) {
			throw new InvalidFormatterParam(
				`default_falsy defaultValue must not be false, NaN, 0, undefined, null or "", found ${defaultValue}.`,
			)
		}
		return value || defaultValue
	},

	default_non_string(value, defaultValue) {
		if (typeof defaultValue !== "string") {
			throw new InvalidFormatterParam(
				`default_non_string defaultValue must be a string, found ${defaultValue}.`,
			)
		}
		return typeof value === "string" ? value : defaultValue
	},

	format_number(value, options = {}, locale = "") {
		// value
		if (typeof value === "string") value = Number.parseFloat(value)
		if (typeof value !== "number" || Number.isNaN(value)) {
			throw new InvalidFormatterValue(`Received value is not a number.`)
		}
		// options
		if (!options || typeof options !== "object") {
			throw new InvalidFormatterParam(
				`format_number options must be an object, found ${options}.`,
			)
		}
		// locale
		if (typeof locale !== "string") {
			throw new InvalidFormatterParam(
				`format_number locale must be a string, found ${locale}.`,
			)
		}
		return new Intl.NumberFormat(
			locale || astroI18n.locale,
			options,
		).format(value)
	},

	format_currency(value, currency, options = {}, locale = "") {
		// value
		if (typeof value === "string") value = Number.parseFloat(value)
		if (typeof value !== "number" || Number.isNaN(value)) {
			throw new InvalidFormatterValue(`Received value is not a number.`)
		}
		// currency
		if (typeof currency !== "string") {
			throw new InvalidFormatterParam(
				`format_currency currency must be a string, found ${currency}.`,
			)
		}
		// options
		if (!options || typeof options !== "object") {
			throw new InvalidFormatterParam(
				`format_currency options must be an object, found ${options}.`,
			)
		}
		// locale
		if (typeof locale !== "string") {
			throw new InvalidFormatterParam(
				`format_currency locale must be a string, found ${locale}.`,
			)
		}
		return new Intl.NumberFormat(locale || astroI18n.locale, {
			...options,
			style: "currency",
			currency,
		}).format(value)
	},

	format_unit(value, unit, options = {}, locale = "") {
		// value
		if (typeof value === "string") value = Number.parseFloat(value)
		if (typeof value !== "number" || Number.isNaN(value)) {
			throw new InvalidFormatterValue(`Received value is not a number.`)
		}
		// unit
		if (typeof unit !== "string") {
			throw new InvalidFormatterParam(
				`format_unit unit must be a string, found ${unit}.`,
			)
		}
		// options
		if (!options || typeof options !== "object") {
			throw new InvalidFormatterParam(
				`format_unit options must be an object, found ${options}.`,
			)
		}
		// locale
		if (typeof locale !== "string") {
			throw new InvalidFormatterParam(
				`format_unit locale must be a string, found ${locale}.`,
			)
		}
		return new Intl.NumberFormat(locale || astroI18n.locale, {
			...options,
			style: "unit",
			unit,
		}).format(value)
	},

	format_date(value, options = {}, locale = "") {
		// value
		if (
			typeof value !== "string" &&
			typeof value !== "number" &&
			!(value instanceof Date)
		) {
			throw new InvalidFormatterValue(
				`Received value is not a string, number or Date.`,
			)
		}
		value = value instanceof Date ? value : new Date(value)
		if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
			throw new InvalidDate(value)
		}
		// options
		if (!options || typeof options !== "object") {
			throw new InvalidFormatterParam(
				`format_currency options must be an object, found ${options}.`,
			)
		}
		// locale
		if (typeof locale !== "string") {
			throw new InvalidFormatterParam(
				`format_currency locale must be a string, found ${locale}.`,
			)
		}

		return new Intl.DateTimeFormat(locale || astroI18n.locale, options)
	},
} as Formatters

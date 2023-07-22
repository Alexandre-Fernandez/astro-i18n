/* eslint-disable camelcase */
import { isDate, isNumber, isObject } from "@lib/ts/guards"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import InvalidDate from "@src/core/translation/errors/formatters/invalid-date.error"
import InvalidFormatterParam from "@src/core/translation/errors/formatters/invalid-formatter-param.error"
import InvalidFormatterValue from "@src/core/translation/errors/formatters/invalid-formatter-value.error copy"

export function upper(value: unknown) {
	if (typeof value !== "string") {
		throw new InvalidFormatterValue(
			`Received value is not a string, found "${value}".`,
		)
	}
	return value.toUpperCase()
}

export function lower(value: unknown) {
	if (typeof value !== "string") {
		throw new InvalidFormatterValue(
			`Received value is not a string, found "${value}".`,
		)
	}
	return value.toLowerCase()
}

export function capitalize(value: unknown) {
	if (typeof value !== "string") {
		throw new InvalidFormatterValue(
			`Received value is not a string, found "${value}".`,
		)
	}
	return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`
}

export function default_nullish(value: unknown, defaultValue: unknown) {
	if (defaultValue == null) {
		throw new InvalidFormatterParam(
			`defaultValue must not be undefined or null, found "${defaultValue}".`,
		)
	}
	return value == null ? defaultValue : value
}

export function default_falsy(value: unknown, defaultValue: unknown) {
	if (!defaultValue) {
		throw new InvalidFormatterParam(
			`defaultValue must not be false, NaN, 0, undefined, null or "", found "${defaultValue}".`,
		)
	}
	return value || defaultValue
}

export function default_non_string(value: unknown, defaultValue: unknown) {
	if (typeof defaultValue !== "string") {
		throw new InvalidFormatterParam(
			`defaultValue must be a string, found "${defaultValue}".`,
		)
	}
	return typeof value === "string" ? value : defaultValue
}

export function intl_format_number(
	value: unknown,
	options: unknown = {},
	locale: unknown = astroI18n.locale,
) {
	// value
	if (typeof value === "string") value = Number.parseFloat(value)
	if (!isNumber(value)) {
		throw new InvalidFormatterValue(
			`Received value is not a number, found "${value}".`,
		)
	}
	// options
	if (!isObject(options)) {
		throw new InvalidFormatterParam(
			`options must be an object, found "${options}".`,
		)
	}
	// locale
	if (typeof locale !== "string") {
		throw new InvalidFormatterParam(
			`locale must be a string, found "${locale}".`,
		)
	}

	return new Intl.NumberFormat(locale, options).format(value)
}

export function intl_format_date(
	value: unknown,
	options: unknown = {},
	locale: unknown = astroI18n.locale,
) {
	// value
	if (
		typeof value !== "string" &&
		typeof value !== "number" &&
		!(value instanceof Date)
	) {
		throw new InvalidFormatterValue(
			`Received value is not a string, number or Date, found "${value}".`,
		)
	}
	value = value instanceof Date ? value : new Date(value)
	if (!isDate(value)) {
		throw new InvalidDate(value)
	}
	// options
	if (!isObject(options)) {
		throw new InvalidFormatterParam(
			`options must be an object, found "${options}".`,
		)
	}
	// locale
	if (typeof locale !== "string") {
		throw new InvalidFormatterParam(
			`locale must be a string, found "${locale}".`,
		)
	}

	return new Intl.DateTimeFormat(locale, options)
}

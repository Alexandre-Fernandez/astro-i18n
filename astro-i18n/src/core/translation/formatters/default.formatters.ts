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
			"upper",
		)
	}
	return value.toUpperCase()
}

export function lower(value: unknown) {
	if (typeof value !== "string") {
		throw new InvalidFormatterValue(
			`Received value is not a string, found "${value}".`,
			"lower",
		)
	}
	return value.toLowerCase()
}

export function capitalize(value: unknown) {
	if (typeof value !== "string") {
		throw new InvalidFormatterValue(
			`Received value is not a string, found "${value}".`,
			"capitalize",
		)
	}
	return `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`
}

export function default_nullish(value: unknown, defaultValue: unknown) {
	return value == null ? defaultValue : value
}

export function default_falsy(value: unknown, defaultValue: unknown) {
	return value || defaultValue
}

export function default_non_string(value: unknown, defaultValue: unknown) {
	return typeof value === "string" ? value : defaultValue
}

export function json(value: unknown, format: unknown = true) {
	if (typeof value === "symbol") {
		throw new InvalidFormatterValue(
			`Received value cannot be a symbol, found "${value.toString()}".`,
			"json",
		)
	}
	if (typeof format !== "boolean") {
		throw new InvalidFormatterParam(
			`format must be a boolean, found "${format}".`,
			"json",
		)
	}
	return format ? JSON.stringify(value, null, "\t") : JSON.stringify(value)
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
			"intl_format_number",
		)
	}
	// options
	if (!isObject(options)) {
		throw new InvalidFormatterParam(
			`options must be an object, found "${options}".`,
			"intl_format_number",
		)
	}
	// locale
	if (typeof locale !== "string") {
		throw new InvalidFormatterParam(
			`locale must be a string, found "${locale}".`,
			"intl_format_number",
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
			"intl_format_date",
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
			"intl_format_date",
		)
	}
	// locale
	if (typeof locale !== "string") {
		throw new InvalidFormatterParam(
			`locale must be a string, found "${locale}".`,
			"intl_format_date",
		)
	}

	return new Intl.DateTimeFormat(locale, options)
}

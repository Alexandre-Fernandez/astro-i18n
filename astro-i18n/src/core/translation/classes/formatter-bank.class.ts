/* eslint-disable camelcase */
import {
	capitalize,
	default_falsy,
	default_non_string,
	default_nullish,
	intl_format_date,
	intl_format_number,
	lower,
	upper,
} from "@src/core/translation/formatters/default.formatters"
import type { Formatters } from "@src/core/translation/types"

class FormatterBank {
	#default: Formatters = {
		upper,
		lower,
		capitalize,
		default_nullish,
		default_falsy,
		default_non_string,
		intl_format_number,
		intl_format_date,
	}

	#custom: Formatters

	#merged: Formatters

	constructor(customFormatters: Formatters = {}) {
		this.#custom = customFormatters
		this.#merged = { ...this.#default, ...this.#custom }
	}

	get default() {
		return this.#default
	}

	get custom() {
		return this.#custom
	}

	toObject() {
		return this.#merged
	}
}

export default FormatterBank

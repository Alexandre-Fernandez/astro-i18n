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
	json,
} from "@src/core/translation/formatters/default.formatters"
import { serializeFormatter } from "@src/core/translation/functions/formatter.functions"
import type {
	Formatters,
	SerializedFormatter,
	SerializedFormatters,
} from "@src/core/translation/types"

/**
 * This class stores formatters to be able to serialize only the custom
 * formatters.
 */
class FormatterBank {
	#default: Formatters = {
		upper,
		uppercase: upper,
		lower,
		lowercase: lower,
		capitalize,
		json,
		default_nullish,
		default: default_falsy,
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

	addFormaters(formatters: Formatters) {
		for (const [name, formatter] of Object.entries(formatters)) {
			if (this.#merged[name]) continue
			this.#merged[name] = formatter
			this.#custom[name] = formatter
		}

		return this
	}

	toClientSideObject() {
		const serializable: { [name: string]: SerializedFormatter } = {}

		for (const [name, formatter] of Object.entries(this.#custom)) {
			serializable[name] = serializeFormatter(formatter)
		}

		return serializable as SerializedFormatters
	}

	toObject() {
		return this.#merged
	}
}

export default FormatterBank

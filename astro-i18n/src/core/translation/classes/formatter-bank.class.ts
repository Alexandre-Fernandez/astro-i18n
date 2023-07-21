import defaultFormatters from "@src/core/translation/formatters/default.formatters"
import type { Formatters } from "@src/core/translation/types"

class FormatterBank {
	#default = defaultFormatters

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

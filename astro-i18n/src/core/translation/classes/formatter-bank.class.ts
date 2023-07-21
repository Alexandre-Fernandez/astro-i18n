import { throwError } from "@lib/error"
import FormatterNotFound from "@src/core/translation/errors/formatters/formatter-not-found.error"
import defaultFormatters from "@src/core/translation/formatters/default.formatters"
import type { Formatters } from "@src/core/translation/types"

class FormatterBank {
	#default = defaultFormatters

	#custom: Formatters

	constructor(customFormatters: Formatters = {}) {
		this.#custom = customFormatters
	}

	get(formatter: string) {
		return (
			this.#custom[formatter] ||
			this.#default[formatter] ||
			throwError(new FormatterNotFound(formatter))
		)
	}
}

export default FormatterBank

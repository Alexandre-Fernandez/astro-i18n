import { objectEntries } from "$lib/typescript-helpers"
import { toDate, toNumber } from "$lib/converters"
import { getDefaultConfig } from "$src/core/fs/config"
import type { AstroI18nConfig } from "$src/types/config"
import type { InterpolationFormatter, TranslationVariant } from "$src/types/app"

class AstroI18n implements AstroI18nConfig {
	defaultLangCode: AstroI18nConfig["defaultLangCode"]

	supportedLangCodes: AstroI18nConfig["supportedLangCodes"]

	showDefaultLangCode: AstroI18nConfig["showDefaultLangCode"]

	translations: AstroI18nConfig["translations"]

	routeTranslations: AstroI18nConfig["routeTranslations"]

	/**
	 * Used internally by astro-i18n.
	 */
	translationVariants: Record<string, TranslationVariant[]> = {}

	#langCode: string

	#formatters: Record<string, InterpolationFormatter> = {
		number: (value, options = {}, langCode = this.#langCode) => {
			if (typeof langCode !== "string") return String(value)
			if (typeof options !== "object" || !options) return String(value)
			const number = toNumber(value)
			if (number === undefined) return String(value)
			return new Intl.NumberFormat(langCode, options).format(number)
		},
		date: (value, options = {}, langCode = this.#langCode) => {
			if (typeof langCode !== "string") return String(value)
			if (typeof options !== "object" || !options) return String(value)
			const date = toDate(value)
			if (date === undefined) return String(value)
			return new Intl.DateTimeFormat(langCode, options).format(date)
		},
	}

	constructor() {
		const defaultConfig = getDefaultConfig()
		this.defaultLangCode = defaultConfig.defaultLangCode
		this.supportedLangCodes = defaultConfig.supportedLangCodes
		this.showDefaultLangCode = defaultConfig.showDefaultLangCode
		this.translations = defaultConfig.translations
		this.routeTranslations = defaultConfig.routeTranslations
		this.#langCode = this.defaultLangCode
	}

	get langCodes() {
		return [this.defaultLangCode, ...this.supportedLangCodes]
	}

	get langCode() {
		return this.#langCode
	}

	set langCode(langCode: string) {
		if (!this.langCodes.includes(langCode)) {
			throw new Error(
				`Cannot set langCode to "${langCode}". "${langCode}" is not not supported, did you add it to the astro-i18n config file ?`,
			)
		}
		this.#langCode = langCode
	}

	get formatters() {
		return this.#formatters
	}

	/**
	 * Used internally by astro-i18n.
	 */
	init(
		astroI18nConfig: AstroI18nConfig,
		variants: Record<string, TranslationVariant[]> = {},
	) {
		for (const [key, value] of objectEntries(astroI18nConfig)) {
			if (this[key] !== undefined) (this as any)[key] = value
		}
		this.translationVariants = variants
	}

	getFormatter(name: string): InterpolationFormatter | undefined {
		return this.#formatters[name]
	}

	setFormatter(name: string, formatter: InterpolationFormatter) {
		this.#formatters[name] = formatter
	}

	deleteFormatter(name: string) {
		delete this.#formatters[name]
	}
}

const astroI18n = new AstroI18n()

export default astroI18n

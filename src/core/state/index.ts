import { objectEntries } from "$lib/typescript-helpers"
import { toDate, toNumber } from "$lib/converters"
import { getDefaultConfig } from "$src/core/fs/config"
import type { AstroI18nConfig } from "$src/types/config"
import type {
	FullRouteTranslationMap,
	InterpolationFormatter,
	TranslationVariant,
} from "$src/types/app"
import { extractRouteLangCode } from "$src/core/routing/lang.code"
import { getTranslationVariants } from "$src/core/translation"
import { merge } from "$lib/object-literal"
import { createFullRouteTranslations } from "$src/core/routing"

class AstroI18n implements AstroI18nConfig {
	defaultLangCode: AstroI18nConfig["defaultLangCode"]

	supportedLangCodes: AstroI18nConfig["supportedLangCodes"]

	showDefaultLangCode: AstroI18nConfig["showDefaultLangCode"]

	translations: AstroI18nConfig["translations"]

	routeTranslations: AstroI18nConfig["routeTranslations"]

	#fullRouteTranslations: FullRouteTranslationMap = {}

	#translationVariants: Record<string, TranslationVariant[]> = {}

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

	internals() {
		return {
			init: this.#init.bind(this),
			translationVariants: this.#translationVariants,
			fullRouteTranslations: this.#fullRouteTranslations,
		}
	}

	addTranslations(translations: AstroI18nConfig["translations"]) {
		const translationsVariants = getTranslationVariants(translations)
		merge(this.translations, translations)
		merge(this.#translationVariants, translationsVariants)
	}

	addRouteTranslations(
		routeTranslations: AstroI18nConfig["routeTranslations"],
	) {
		const fullRouteTranslations = createFullRouteTranslations({
			...this,
			routeTranslations,
		})
		merge(this.routeTranslations, routeTranslations)
		merge(this.#fullRouteTranslations, fullRouteTranslations)
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

	init(
		Astro: { url: URL },
		formatters?: Record<string, InterpolationFormatter>,
	) {
		let langCode = extractRouteLangCode(Astro.url.pathname, this.langCodes)
		if (langCode && !this.langCodes.includes(langCode)) {
			langCode = this.defaultLangCode
		}
		this.langCode = langCode || this.defaultLangCode

		if (formatters) {
			for (const [name, formatter] of Object.entries(formatters)) {
				this.setFormatter(name, formatter)
			}
		}
	}

	#init(
		astroI18nConfig: AstroI18nConfig,
		variants: Record<string, TranslationVariant[]> = {},
		fullRouteTranslations: FullRouteTranslationMap = {},
	) {
		for (const [key, value] of objectEntries(astroI18nConfig)) {
			if (this[key] !== undefined) (this as any)[key] = value
		}
		this.#fullRouteTranslations = fullRouteTranslations
		this.#translationVariants = variants
	}
}

const astroI18n = new AstroI18n()

export default astroI18n

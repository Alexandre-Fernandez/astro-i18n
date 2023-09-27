/* eslint-disable sonarjs/no-duplicate-string */
import { expect, test } from "vitest"
import { astroI18n } from "astro-i18n"

test("Common translations are accessible on every page.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("commonBasic")).toBe("en.commonBasic")
	expect(astroI18n.t("nested.commonNested")).toBe("en.commonNested")
	astroI18n.route = "/fr"
	expect(astroI18n.t("commonBasic")).toBe("fr.commonBasic")
	expect(astroI18n.t("nested.commonNested")).toBe("fr.commonNested")

	astroI18n.route = "/page"
	expect(astroI18n.t("commonBasic")).toBe("en.commonBasic")
	astroI18n.route = "/fr/page"
	expect(astroI18n.t("commonBasic")).toBe("fr.commonBasic")
})

test("Page translations are only accessible on their page.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("pageTranslation")).not.toBe("en.pageTranslation")
	astroI18n.route = "/fr"
	expect(astroI18n.t("pageTranslation")).not.toBe("fr.pageTranslation")

	astroI18n.route = "/page"
	expect(astroI18n.t("pageTranslation")).toBe("en.pageTranslation")
	astroI18n.route = "/fr/page"
	expect(astroI18n.t("pageTranslation")).toBe("fr.pageTranslation")
})

test("`t`'s locale override.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("commonBasic", undefined, { locale: "fr" })).toBe(
		"fr.commonBasic",
	)
})

test("`t`'s route override.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("pageTranslation", undefined, { route: "/page" })).toBe(
		"en.pageTranslation",
	)
})

test("Translation variants.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("commonVariant")).toBe(
		"en.commonVariant (default value)",
	)
	expect(astroI18n.t("commonVariant", { n: -2 })).toBe(
		"en.commonVariant (n === -2)",
	)
	expect(astroI18n.t("commonVariant", { n: -1 })).toBe(
		"en.commonVariant (n === -2)",
	)
	expect(astroI18n.t("commonVariant", { n: 0 })).toBe(
		"en.commonVariant (n === -2)",
	)
	expect(astroI18n.t("commonVariant", { n: 1 })).toBe(
		"en.commonVariant (n === 2)",
	)
	expect(astroI18n.t("commonVariant", { n: 2 })).toBe(
		"en.commonVariant (n === 2)",
	)
	expect(astroI18n.t("commonVariant", { n: 2, x: "text" })).toBe(
		"en.commonVariant (n === 2 && x === 'text')",
	)
	expect(astroI18n.t("commonVariant", { n: 3 })).toBe(
		"en.commonVariant (n === 3 && $priority === 100)",
	)
	expect(astroI18n.t("commonVariant", { n: 4 })).toBe(
		"en.commonVariant (n === 4 || n === 'text' || 'n === true')",
	)
	expect(astroI18n.t("commonVariant", { n: "text" })).toBe(
		"en.commonVariant (n === 4 || n === 'text' || 'n === true')",
	)
	expect(astroI18n.t("commonVariant", { n: true })).toBe(
		"en.commonVariant (n === 4 || n === 'text' || 'n === true')",
	)
})

test("Translation interpolations.", () => {
	astroI18n.route = "/"
	let value: any = "test"
	expect(astroI18n.t("commonInterpolation", { value })).toBe(
		'en.commonInterpolation ("test")',
	)
	value = { object: "value" }
	expect(astroI18n.t("commonInterpolation", { value })).toBe(
		`en.commonInterpolation (${JSON.stringify(value)})`,
	)
	expect(
		astroI18n.t("commonInterpolationAlias", { value, alias: false }),
	).toBe(`en.commonInterpolation (${JSON.stringify(value)})`)
	expect(
		astroI18n.t("commonInterpolationChained", { value, alias: false }),
	).toBe(`en.commonInterpolation (${JSON.stringify(value).toUpperCase()})`)
	value = 69
	expect(
		astroI18n.t("commonInterpolationCurrency", {
			value,
			currencyCode: "EUR",
		}),
	).toBe(`en.commonInterpolation (${value},00${String.fromCodePoint(160)}€)`)
})

test("Translation load directives.", () => {
	astroI18n.route = "/"
	expect(astroI18n.t("groupTranslation1")).not.toBe("en.groupTranslation1")
	expect(astroI18n.t("groupTranslation2")).not.toBe("en.groupTranslation2")
	astroI18n.route = "/group"
	expect(astroI18n.t("groupTranslation1")).toBe("en.groupTranslation1")
	expect(astroI18n.t("groupTranslation2")).toBe("en.groupTranslation2")
	astroI18n.route = "/group/inner"
	expect(astroI18n.t("groupTranslation1")).not.toBe("en.groupTranslation1")
	expect(astroI18n.t("groupTranslation2")).toBe("en.groupTranslation2")
})

test("to-do: t.options.formatters", () => {
	astroI18n.route = "/"
	expect(true).toBe(true)
})

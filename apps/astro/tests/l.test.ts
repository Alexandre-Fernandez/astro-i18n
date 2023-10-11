/* eslint-disable sonarjs/no-duplicate-string */
import { expect, test } from "vitest"
import { astroI18n } from "astro-i18n"

test("Show/hide primary locale.", () => {
	astroI18n.internals.config.showPrimaryLocale = true
	astroI18n.route = "/en"
	expect(astroI18n.l("/")).toBe("/en")
	astroI18n.route = "/fr"
	expect(astroI18n.l("/")).toBe("/fr")
	astroI18n.internals.config.showPrimaryLocale = false
	astroI18n.route = "/en"
	expect(astroI18n.l("/")).toBe("/")
	astroI18n.route = "/fr"
	expect(astroI18n.l("/")).toBe("/fr")
})

test("Segment translations.", () => {
	astroI18n.route = "/"
	expect(astroI18n.l("/")).toBe("/")
	astroI18n.route = "/fr"
	expect(astroI18n.l("/")).toBe("/fr")
	astroI18n.route = "/group/inner"
	expect(astroI18n.l("/group/inner")).toBe("/group/inner")
	astroI18n.route = "/fr/groupe/interieur"
	expect(astroI18n.l("/group/inner")).toBe("/fr/groupe/interieur")
})

test("Trailing slash.", () => {
	astroI18n.internals.config.trailingSlash = "always"
	astroI18n.route = "/"
	expect(astroI18n.l("/")).toBe("/")
	astroI18n.route = "/fr"
	expect(astroI18n.l("/")).toBe("/fr/")
	astroI18n.route = "/group/inner"
	expect(astroI18n.l("/group/inner")).toBe("/group/inner/")
	astroI18n.internals.config.trailingSlash = "never"
	astroI18n.route = "/"
	expect(astroI18n.l("/")).toBe("/")
	astroI18n.route = "/fr"
	expect(astroI18n.l("/")).toBe("/fr")
	astroI18n.route = "/group/inner"
	expect(astroI18n.l("/group/inner")).toBe("/group/inner")
})

test("Locale detection.", () => {
	astroI18n.route = "/group"
	expect(astroI18n.l("/groupe/interieur")).toBe("/group/inner")
	astroI18n.route = "/interieur"
	expect(astroI18n.l("/groupe/interieur")).toBe("/fr/groupe/interieur")
})

test("Route parameters.", () => {
	astroI18n.route = "/"
	expect(
		astroI18n.l("/[param1]/[param2]", { param1: "foo", param2: "bar" }),
	).toBe("/foo/bar")
})

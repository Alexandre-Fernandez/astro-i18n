import { expect, test } from "vitest"
import { astroI18n } from "astro-i18n"

test("to-do: l", () => {
	astroI18n.route = "/"
	expect(true).toBe(true)
})

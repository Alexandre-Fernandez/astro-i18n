import { assert, expect, test } from "vitest"
import { astroI18n, useAstroI18n } from "astro-i18n"

useAstroI18n()({} as any, async () => new Response())
await astroI18n.internals.serverInit()

test("Math.sqrt()", () => {
	expect(Math.sqrt(4)).toBe(2)
	expect(Math.sqrt(144)).toBe(12)
	expect(Math.sqrt(2)).toBe(Math.SQRT2)
})

test("JSON", () => {
	const input = {
		foo: "hello",
		bar: "world",
	}

	const output = JSON.stringify(input)

	expect(output).eq('{"foo":"hello","bar":"world"}')
	assert.deepEqual(JSON.parse(output), input, "matches original")
})

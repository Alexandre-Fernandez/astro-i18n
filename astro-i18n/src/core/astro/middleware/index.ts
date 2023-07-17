import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import "@src/core/translation/classes/interpolation.class"
import "@src/core/translation/classes/variant.class"
import Environment from "@src/core/state/enums/environment.enum"
import type { AstroI18nConfig } from "@src/core/config/types"
import type { AstroMiddleware } from "@src/core/astro/types"

export const singleton = {
	value: 0,
}

// TODO { config?: Partial<AstroI18nConfig> | string, formatters?: Formatter[] }
// serialize formatter
export function useAstroI18n(config?: Partial<AstroI18nConfig> | string) {
	astroI18n.init(config)

	return ((ctx, next) => {
		if (import.meta.env.DEV && astroI18n.environment === Environment.NODE) {
			astroI18n.init(config) // get filesystem translations on every request
		}

		// check what page it is
		// build translations for that page (common + specific)
		// build route translations for that page²

		// how to do this for route translations ?
		// giving all routes out is bad security wise
		// need group feature ?

		// add these translations to the singleton & to the dom inside <script type="text/json"></script> (so that it can be fetched on the client side)

		// load from file or load from config that's it

		// await Config.findConfig()

		// console.log(JSON.stringify(await Config.fromFilesystem(), null, 2))

		singleton.value += 1
		return next()
	}) as AstroMiddleware
}

// PROD = load translation from FS once
// DEV = load translation from FS on request

// Serverless = load config from params
// Node = load config from FS

/*
	check pages for client:directive :
	=> if no client:directive, generate all in server
	=> if client:directive, get current locale common translations and current page translations and put them in a <script type="text/json"></script>
*/

/*
{
	"my": {
		"translation": "Just a normal day.",
		"translation{weather:'cold'}": "It's really rainy today.",
		"translation{weather:'hot'}": "It's really sunny today."
	}
}

{
	"my": {
		"translation1": "My name is {name}.",
		"translation2": "My name is {name:'Alex'}.",
		"translation3": "My name is {name:'Jessica'uppercase}.",
		"translation3": "My name is {nameuppercaselowercase}."
	}
}

{
	"my": {
		"translation1": "It costs {amountnumber(options)}.",
		"translation2": "It was the {datetimedate(options)}."
	}
}


{
	"key": "default value",
	"key{{n: 1, prop:'test'}}": "value"
	"key{{n: [0, 2]}}": "values"
}

{
	"key{{n: [0, 2]}}": "interpolation {{value>formatter1(args)>formatter2({nested: {test: 'ttt'}}, var(alias)>formatter3: 0}):'default value'}}"
}





{
	"key{{n: [0, 2]}}": "interpolation {#value>formatter1(args:{})>formatter2({lol: {xd: nestedvar, val: 1}}, var(alias)>formatter3: 0}):'default value'#}"
}

{
	"key{{n: [0, 2]}}": "interpolation {#{xd: nestedvar, val: 1}#}"
}


	{
		properties: [["n", "n"]],
	}

	{
		name: "value",
		alias: "value",
		defaultValue: "default value",
		"formatters": [
			{
				name: "formatter1",
				arguments: [
					{
						name: "args"
						alias: "args",
						defaultValue: {},
					}
				]
			}, 
			{
				name: "formatter2",
				arguments: [
					{
						value: { nested: {test: 'ttt'} }
					},
					{
						name: "var"
						alias: "alias",
						defaultValue: 0,
						formatters: [
							{
								name: "formatter3",
								arguments: []
							}
						]
					}
				]
			}
		]
	}
*/

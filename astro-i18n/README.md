<div align="center" >
	<img src="https://raw.githubusercontent.com/Alexandre-Fernandez/astro-i18n/0fb145cf64ef94968ca70c36b52a922fa897d11a/img/logo.svg" alt="astro-i18n logo" width="33%">
</div>

# astro-i18n

A TypeScript-first internationalization library for [Astro](https://github.com/withastro/astro).

## Key features

-   🪶 Lightweight.
-   🏗️ Build-time loading.
-   🌏 Internationalized routing.
-   🔒 Type-safety and autocompletion.
-   🔧 Support for plurals, context, interpolations and formatters.
-   🚀 Built for [Astro](https://github.com/withastro/astro) and nothing else.

## Preview

### Translation function

![Translation function preview.](https://github.com/Alexandre-Fernandez/astro-i18n/blob/main/img/t.png?raw=true "Translation function preview.")

### Translated routing function

![Translated routing function preview.](https://github.com/Alexandre-Fernandez/astro-i18n/blob/main/img/l.png?raw=true "Translated routing function preview.")

## Content page

-   [Get started](#get-started)
    -   [Installation](#installation)
    -   [Setup](#setup)
    -   [Configuration](#configuration)
    -   [That's it](#thats-it)
-   [Reference](#reference)
    -   [Declare your translations directly in `pages`](#declare-your-translations-directly-in-pages)
    -   [Variants](#variants)
    -   [Interpolation](#interpolation)
    -   [API](#api)
    -   [CLI](#cli)
-   [Contributors](#contributors)

## Get started

-   Star the [github repo](https://github.com/alexandre-fernandez/astro-i18n) 😎

### Installation

```yml
# npm
npm install astro-i18n
# yarn
yarn add astro-i18n
# pnpm
pnpm add astro-i18n
```

### Setup

#### Automatic

Run the following command.

```yml
# node
node_modules/.bin/astro-i18n install
# deno
deno run npm:astro-i18n install
```

Add `astroI18n.init(Astro)` at the start of your page's frontmatter.

```astro
---
import { astroI18n } from "astro-i18n"

astroI18n.init(Astro)
---

<MyApp />
```

[Go to next step.](#configuration)

#### Manual

Add [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) to your `astro.config` integrations.

```ts
import { defineConfig } from "astro/config"
import i18n from "astro-i18n"

export default defineConfig({ integrations: [i18n()] })
```

Create an `astro.i18n.config` file, supported extensions are `.js`, `.cjs`, `.mjs`, `.ts`, `.cts`, `.mts`, `.json`.
You can use the `defineAstroI18nConfig` helper to get autocompletion.

```ts
import { defineAstroI18nConfig } from "astro-i18n"

export default defineAstroI18nConfig({
	defaultLangCode: "en",
	supportedLangCodes: [],
	showDefaultLangCode: false,
	trailingSlash: "never",
	translations: {},
	routeTranslations: {},
})
```

Add the following line to `src/env.d.ts`. You may get an error because the file doesn't exist yet, it's ok.
This file will contain your generated types, if you want to remove the error for now you can create a placeholder for that path.

```ts
/// <reference path="../.astro-i18n/generated.d.ts" />
```

Add the following command to your scripts.

```ts
// node
{
	"i18n:sync": "astro-i18n sync"
}
// deno
{
	"i18n:sync": "deno run npm:astro-i18n sync"
}
```

Add `astroI18n.init(Astro)` at the start of your page's frontmatter.

```astro
---
import { astroI18n } from "astro-i18n"

astroI18n.init(Astro)
---

<MyApp />
```

### Configuration

#### `defaultLangCode`

Determines your default language.
It's `en` by default.

#### `supportedLangCodes`

An array of all the supported languages that are not your `defaultLangCode`.
This is an empty array by default.

#### `showDefaultLangCode`

This will control the visibility of the `defaultLangCode` in the URL.
If `defaultLangCode` is `en` and if `showDefaultLangCode` is true your index page will be `/en` instead of `/`.
It's false by default.

#### `trailingSlash`

Determines if trailing slashes should be included in URLs or not.
Possible values are `always` and `never`.
It's `never` by default.

#### `translations`

Add your translations as code, or provide a file path to load them from a `.json` file.
You can also add page specific `translations` directly from the page's directory.

```ts
export default defineAstroI18nConfig({
	defaultLangCode: "en",
	supportedLangCodes: ["de"],
	translations: {
		en: {
			my: {
				translation: "A text translation".
			}
		},
		de: "root/relative/path/to/my/german/translations.json"
	},
})
```

#### `routeTranslations`

This works similarly to `translations`, except the language's object is not nested and you don't need to provide translations for your `defaultLangCode`.
You can also add your `routeTranslations` directly from the page's directory.

```ts
export default defineAstroI18nConfig({
	defaultLangCode: "en",
	supportedLangCodes: ["fr", "it"],
	routeTranslations: {
		fr: {
			about: "a-propos",
			products: "produits",
			posts: "articles",
		},
		it: "root/relative/path/to/my/italian/route/translations.json",
	},
})
```

### That's it

Run the following command to generate the types corresponding to your configuration and translations.

```yml
# node
npm run i18n:sync
# deno
deno run npm:astro-i18n install
```

Start translating.

```astro
---
import { astroI18n, t, l } from "astro-i18n"

astroI18n.init(Astro)
---

<a href={ l("/about") }>
	{ t("page.about") }
</a>
```

## Reference

### Declare your translations directly in `pages`

You can have your translation and your route translations sitting directly with your pages by having an `i18n` folder next to them. The `.json` translations files will be named after the language they cover.
You can use the special translation key `"{route}"` to translate the route.

#### Example

```yml
src/
├── pages/
│   ├── index.astro
│   ├── i18n/
│   │   ├── en.json
│   │   └── fr.json
│   └── about/
│       ├── index.astro
│       └── i18n/
│           ├── en.json
│           └── fr.json
```

_src/pages/about/i18n/fr.json_

```json
{
	"{route}": "a-propos",
	"my": {
		"translation:": "Une traduction."
	}
}
```

### Variants

---

Variants are the way that plurals and context are handled. At the moment they support `string` and `number` values (you can mix them).
[astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) will try to find the closest match.
If there is a variantless translation key, it will be used as a default value.

-   Numbers will match the closest one.
-   Strings will match exact matches.

#### Examples

##### Numbers

```json
{
	"my": {
		"translation": "I have nothing.",
		"translation{nCars:1, nBikes:1}": "I have a car and a bike.",
		"translation{nCars:2, nBikes:1}": "I have a lot of cars but only one bike.",
		"translation{nCars:1, nBikes:2}": "I have only one car but a lot of bikes.",
		"translation{nCars:2, nBikes:2}": "I have a lot of cars and bikes."
	}
}
```

```ts
import { t } from "astro-i18n"

t("my.translation") // "I have nothing."
t("my.translation", { nCars: 0, nBikes: 1 }) // "I have a car and a bike."
t("my.translation", { nCars: 11, nBikes: 0 }) // "I have a lot of cars but only one bike."
t("my.translation", { nCars: -7, nBikes: 5 }) // "I have only one car but a lot of bikes."
t("my.translation", { nCars: 2, nBikes: 15 }) // "I have a lot of cars and bikes."
```

##### Strings

```json
{
	"my": {
		"translation": "Just a normal day.",
		"translation{weather:'cold'}": "It's really rainy today.",
		"translation{weather:'hot'}": "It's really sunny today."
	}
}
```

```ts
import { t } from "astro-i18n"

t("my.translation") // "Just a normal day."
t("my.translation", { weather: "cold" }) // "It's really rainy today."
t("my.translation", { weather: "hot" }) // "It's really sunny today."
```

---

### Interpolation

---

Interpolations allow you to insert content into a translation. The inserted content can be pre-processed by formatters.

#### Example

```json
{
	"my": {
		"translation1": "My name is {name}.",
		"translation2": "My name is {name:'Alex'}.",
		"translation3": "My name is {name:'Jessica'|uppercase}.",
		"translation3": "My name is {name|uppercase|lowercase}."
	}
}
```

```ts
import { t } from "astro-i18n"

t("my.translation1", { name: "Patrick" }) // "My name is Patrick."
t("my.translation2") // "My name is Alex."
t("my.translation3") // "My name is JESSICA."
t("my.translation3", { name: "JoHn" }) // "My name is john."
```

#### Formatters

Formatters are functions that take the inserted value (or default value if none) and return a string. If there's more than one formatter for the same interpolation they will be chained. You can add custom formatters using [`astroI18n.init`](#astroi18n) or [astroI18n.addFormatter](#astroi18n).
Just like the main interpolation value, formatters can also take variables that will be given at run-time through the `t` function options.

##### Example

```json
{
	"my": {
		"translation1": "It costs {amount|number(options)}.",
		"translation2": "It was the {datetime|date(options)}."
	}
}
```

```ts
import { t } from "astro-i18n"
// current language is english ("en")

t("my.translation1", {
	amount: 50,
	options: { style: "currency", currency: "EUR" },
}) // "It costs €50.00."
t("my.translation2", {
	datetime: Date.now(),
	options: { dateStyle: "full" },
}) // "It was the Saturday, 26 November 2022."
```

##### Default formatters

###### `date`

A wrapper around [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
It can take a `Date`, a `number` or a `string` as value.
Displays the year, month and days and uses the current language by default.

`date(value: unknown, options: Intl.DateTimeFormatOptions = {}, langCode = astroI18n.langCode)`

###### `number`

A wrapper around [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).
It can take a `number` or a `string` as value.
Displays the given number to the given language format by default (uses the current one if not provided).

`number(value: unknown, options: Intl.NumberFormatOptions = {}, langCode = astroI18n.langCode)`

---

### API

---

#### `i18n`

The `i18n` function is the default [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) export and the astro integration function.
It can take an optional path to your [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) config file, if it's not in the root.

#### `defineAstroI18nConfig`

The `defineAstroI18nConfig` is an helper to give you autocompletion and type-safety when defining your [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) config.

#### `extractRouteLangCode`

This function will extract a supported lang code (either the default one or one inside `supportedLangCodes`) from the given route.

#### `createStaticPaths`

This function will create a getStaticPaths handler that provides the current page lang code inside the first function parameter.
Example: `export const getStaticPaths = createStaticPaths(({langCode}) => { /* getStaticPaths logic... */ }, import.meta.url)`.

#### `renderContent`

A replacement for the Astro's [render function](https://docs.astro.build/en/guides/content-collections/#rendering-content-to-html).
There is a [issue](https://github.com/Alexandre-Fernandez/astro-i18n/issues/34#issuecomment-1553764243) with the native render function, you can use this replacement to achieve the same result.
The only difference is that you'll get an HTML string instead of an Astro component. You can display it using `<div set:html={html} />`.

#### `appendQueryString`

A helper function to append a query string to a url/route.

#### `astroI18n`

This is where the [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) run-time state resides.
The `langCode` gets updated thanks to `astroI18n.init`, because of this it is only usable after the function runs.

-   `defaultLangCode`: see [configuration](#configuration).
-   `supportedLangCodes`: see [configuration](#configuration).
-   `showDefaultLangCode`: see [configuration](#configuration).
-   `trailingSlash`: see [configuration](#configuration).
-   `translations`: see [configuration](#configuration).
-   `routeTranslations`: see [configuration](#configuration).
-   `init`: A function to initialize astro-i18n for the current request/page, it will set [`astroI18n.langCode`](#astroi18n) to the current one. You can pass an object containing your custom formatters for them to be available, e.g. `astroI18n.init(Astro, { myFormatter: (value) => String(value)})`.
-   `langCode`: The langCode for the current page.
-   `langCodes`: A concatenation of `defaultLangCode` and `supportedLangCodes`.
-   `addTranslations`: Adds translations at runtime, see [configuration](#configuration).
-   `addRouteTranslations`: Adds route translations at runtime, see [configuration](#configuration).
-   `getFormatter` / `setFormatter` / `deleteFormatter`: Functions to manage formatters.

#### `t`

The `t` function is the main function to translate, it can take up to three arguments.

-   `path`: Your translation path, e.g. `"path.to.my.translation"`.
-   `options`: (optional) An object containing all the `path`'s translation [variant](#variants) properties, [interpolation](#interpolation) and [formatter](#formatters) arguments.
-   `langCode`: (optional) The target language, it will default to [`astroI18n.langCode`](#astroi18n).

#### `l`

The `l` function is a function used to get translated routes, it can take up to four arguments.

-   `route`: The route to translate, it can take parameters, e.g. `"/posts/[id]"`.
-   `params`: (optional) An object containing all the `route`'s params.
-   `targetLangCode`: (optional) The target language, it will default to [`astroI18n.langCode`](#astroi18n).
-   `routeLangCode`: (optional) The `route` langCode, the `l` function will try to auto-detect it but you can override it here. If not overridden and the auto-detection fails it will default to the `defaultLangCode`.

#### `HrefLangs`

An astro component that will automatically generate hreflang tags for the current page. This is used for SEO, add it to the `<head>` of your page.
Import it from `"astro-i18n/components"`

---

### CLI

---

#### `astro-i18n install`

-   Adds [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) to your integrations.
-   Generates an [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) config file (no override).
-   Generates a placeholder file for your generated types (no override).
-   Links your ambient `env.d.ts` to your generated types.
-   Creates [astro-i18n](https://github.com/alexandre-fernandez/astro-i18n) commands in your `package.json` / `deno.json`.

| Option   | Shortcut | Default        | Description                                                                                   |
| -------- | -------- | -------------- | --------------------------------------------------------------------------------------------- |
| --config | -c       | Project's root | A custom path relative from the project's root where you want your astro-i18n config created. |

#### `astro-i18n sync`

-   Generates translated routes (`astro-i18n sync:pages`).
-   Generates types for your current translations & route translations (`astro-i18n sync:types`).

| Option   | Shortcut | Default        | Description                                                                                   |
| -------- | -------- | -------------- | --------------------------------------------------------------------------------------------- |
| --config | -c       | Project's root | A custom path relative from the project's root where you want your astro-i18n config created. |

#### `astro-i18n extract:keys`

-   Generates a json file containing all the pure `string` translation keys you used with the [`t`](#t) function in the `src` directory.

## Contributors

<table>
	<tbody>
		<tr>
			<td align="center">
				<a href="https://github.com/Alexandre-Fernandez">
					<figure>
						<img src="https://avatars.githubusercontent.com/u/79476242?v=4?s=100" width="100px;"
							alt="Alexandre Fernandez">
						<br />
						<figcaption><sub>Alexandre Fernandez</sub></figcaption>
					</figure>
				</a>
			</td>
			<td align="center">
				<a href="https://github.com/FabianLars">
					<figure>
						<img src="https://avatars.githubusercontent.com/u/30730186?v=4?s=100" width="100px;"
							alt="Fabian Lars">
						<br />
						<figcaption><sub>Fabian Lars</sub></figcaption>
					</figure>
				</a>
			</td>
			<td align="center">
				<a href="https://github.com/lorenzolewis">
					<figure>
						<img src="https://avatars.githubusercontent.com/u/15347255?v=4?s=100" width="100px;"
							alt="Lorenzo Lewis">
						<br />
						<figcaption><sub>Lorenzo Lewis</sub></figcaption>
					</figure>
				</a>
			</td>
		</tr>
	</tbody>
</table>

import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { isDirectory, isFile } from "@lib/async-node/functions/fs.functions"
import AsyncNode from "@lib/async-node/classes/async-node.class"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import { VARIANT_PRIORITY_KEY } from "@src/core/translation/constants/variant.constants"
import { extractRouteParameters } from "@src/core/routing/functions"
import Environment from "@src/core/state/enums/environment.enum"
import { PACKAGE_NAME } from "@src/constants/meta.constants"
import { GENERATED_TYPES_PATTERN } from "@src/core/cli/constants/cli-patterns.constants"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import type { Command, ParsedArgv } from "@lib/argv/types"
import type { TranslationVariables } from "@src/core/translation/types"

const cmd = {
	name: "generate:types",
	options: ["root"],
} as const satisfies Command

export async function generateTypes({ command, options }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()
	const { join } = await AsyncNode.path
	const { readFileSync, appendFileSync, writeFileSync } = await AsyncNode.fs

	const root = await toPosixPath(
		typeof options["root"] === "string" ? options["root"] : process.cwd(),
	)
	if (!(await isDirectory(root))) throw new RootNotFound()

	await astroI18n.initialize()

	const translationVariables =
		astroI18n.internals.translations.getLocaleTranslationVariables(
			astroI18n.primaryLocale,
		)
	const routes = astroI18n.internals.translations.getRouteGroups()

	// dynamic types
	let types = `type PrimaryLocale = "${astroI18n.primaryLocale}"\n`
	types += `type SecondaryLocale = "${astroI18n.secondaryLocales.join(
		'"|"',
	)}"\n`
	types += `type Locale = PrimaryLocale | SecondaryLocale\n`
	types += `${createRouteParametersType("RouteParameters", routes)}\n`
	types += `type Route = keyof RouteParameters\n`
	types += `${createTranslationVariablesType(
		"TranslationVariables",
		translationVariables,
	)}\n`
	types += `type Translation = keyof TranslationVariables\n`

	// static types
	types += `type Environment = "${Object.values(Environment).join('"|"')}"\n`
	types += `
declare module "${PACKAGE_NAME}" {
	export * from "${PACKAGE_NAME}/"
	/**
	 * @param key The translation key, for example \`"my.nested.translation.key"\`.
	 * @param properties An object containing your interpolation variables and/or your variants, for example \`{ variant: 3, interpolation: "text" }\`.
	 * @param options \`route\`: Overrides the current route, you will be able to access that route's translations. \`locale\`: Overrides the current locale, this allows you to control which language you want to translate to. \`fallbackLocale\`: Overrides the fallback locale.
	 */
	export function t<T extends Translation>(
		key: T | string & {},
		...args: undefined extends TranslationVariables[T]
			? [
				properties?: keyof TranslationVariables extends T 
					? Record<string, unknown> 
					: TranslationVariables[T], 
				options?: {
					route?: Route | string & {}
					locale?: Locale | string & {}
					fallbackLocale?: Locale | string & {}
				}
			]
			: [
				properties: TranslationVariables[T], 
				options?: {
					route?: Route | string & {}
					locale?: Locale | string & {}
					fallbackLocale?: Locale | string & {}
				}
			]
	): string
	/**
	 * @param route A route in any of the configured languages, for example \`"/en/my/english/route/[param]"\`.
	 * @param parameters An object containing your route parameters, for example \`{ slug: "my-blog-post-slug" }\`.
	 * @param options \`targetLocale\`: Overrides the target locale. \`routeLocale\`: Overrides the given route locale, this is useful if ${PACKAGE_NAME} cannot figure out the route's locale. \`showPrimaryLocale\`: Overrides the showPrimaryLocale parameter.
	 */
	export function l<T extends Route>(
		route: T | string & {},
		...args: T extends keyof RouteParameters
			? undefined extends RouteParameters[T]
				? [
					parameters?: Record<string, string>, 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string,
						showPrimaryLocale?: string
					}
				]
				: [
					parameters: RouteParameters[T], 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string,
						showPrimaryLocale?: string
					}
				]
			: [
				parameters?: Record<string, string>, 
				options?: { 
					targetLocale?: string, 
					routeLocale?: string,
					showPrimaryLocale?: string
				}
			]
	): string
	type DeepStringRecord = {[key: string]:string|DeepStringRecord}
	type TranslationDirectory = {i18n?:string;pages?: string}
	export type Translations = {[group: string]:{[locale: string]: DeepStringRecord}}
	export type TranslationFormatters = {[formatterName: string]:(value:unknown,...args:unknown[])=>unknown}
	export type TranslationLoadingRules = {groups:string[];routes: string[]}[]
	export type SegmentTranslations = {[secondaryLocale: string]:{[segment: string]:string}}
	export interface AstroI18nConfig {primaryLocale:string;secondaryLocales:string[];fallbackLocale:string;showPrimaryLocale:boolean;trailingSlash:"always"|"never";run:"server"|"client+server";translations:Translations;translationLoadingRules:TranslationLoadingRules;translationDirectory:TranslationDirectory;routes:SegmentTranslations;}
	class AstroI18n {
		/** The detected runtime environment. */
		environment: Environment
		/** The current page route. */
		route: string
		/** All page routes. For example: \`["/", "/about", "/posts/[slug]"]\` */
		pages: string[]
		/** The equivalent page for the current route. For example if route is equal to \`"/posts/my-cool-cat"\` this could return \`"/posts/[slug]"\`. */
		page: string
		/** The current page locale. */
		locale: Locale
		/** All configured locales. */
		locales: Locale[]
		/** The default/primary locale. */
		primaryLocale: PrimaryLocale
		/** Locales other than the default/primary one. */
		secondaryLocales: SecondaryLocale[]
		/** The fallback locale, when a translation is missing in a locale the fallback locale will be used to find a replacement. */
		fallbackLocale: Locale
		/** True when ${PACKAGE_NAME} is initialized. */
		isInitialized: boolean
		/**
		 * @param key The translation key, for example \`"my.nested.translation.key"\`.
		 * @param properties An object containing your interpolation variables and/or your variants, for example \`{ variant: 3, interpolation: "text" }\`.
		 * @param options \`route\`: Overrides the current route, you will be able to access that route's translations. \`locale\`: Overrides the current locale, this allows you to control which language you want to translate to. \`fallbackLocale\`: Overrides the fallback locale.
		 */
		t<T extends Translation>(
			key: T | string & {},
			...args: undefined extends TranslationVariables[T]
				? [
					properties?: keyof TranslationVariables extends T 
						? Record<string, unknown> 
						: TranslationVariables[T], 
					options?: {
						route?: Route | string & {}
						locale?: Locale | string & {}
						fallbackLocale?: Locale | string & {}
					}
				]
				: [
					properties: TranslationVariables[T], 
					options?: {
						route?: Route | string & {}
						locale?: Locale | string & {}
						fallbackLocale?: Locale | string & {}
					}
				]
		): string
		/**
		 * @param route A route in any of the configured languages, for example \`"/en/my/english/route/[param]"\`.
		 * @param parameters An object containing your route parameters, for example \`{ slug: "my-blog-post-slug" }\`.
		 * @param options \`targetLocale\`: Overrides the target locale. \`routeLocale\`: Overrides the given route locale, this is useful if ${PACKAGE_NAME} cannot figure out the route's locale. \`showPrimaryLocale\`: Overrides the showPrimaryLocale parameter.
		 */
		l<T extends Route>(
			route: T | string & {},
			...args: T extends keyof RouteParameters
				? undefined extends RouteParameters[T]
					? [
						parameters?: Record<string, string>, 
						options?: { 
							targetLocale?: string, 
							routeLocale?: string,
							showPrimaryLocale?: string
						}
					]
					: [
						parameters: RouteParameters[T], 
						options?: { 
							targetLocale?: string, 
							routeLocale?: string,
							showPrimaryLocale?: string
						}
					]
				: [
					parameters?: Record<string, string>, 
					options?: { 
						targetLocale?: string, 
						routeLocale?: string,
						showPrimaryLocale?: string
					}
				]
		): string
		/** Adds new translations at runtime. */
		addTranslations(translations: Translations): this
		/** Adds new translation formatters at runtime. */
		addFormatters(translationFormatters: TranslationFormatters): this
		/** Adds new translation loading rules at runtime. */
		addTranslationLoadingRules(translationLoadingRules: TranslationLoadingRules): this
		/** Adds new route segment translations at runtime. */
		addRoutes(routes: SegmentTranslations): this
		/** Tries to parse one of the configured locales out of the given route. If no configured locale is found it will return \`null\`. */
		extractRouteLocale(route: string): string|null
		/** Initializes ${PACKAGE_NAME} on the server-side. */
		initialize(config?: Partial<AstroI18nConfig> | string, formatters?: TranslationFormatters = {}): Promise<void>
	}
	export const astroI18n: AstroI18n
}`

	const envDtsPath = join(root, "src", "env.d.ts")

	if (await isFile(envDtsPath)) {
		const data = readFileSync(envDtsPath, { encoding: "utf8" })
		const { match, range } = GENERATED_TYPES_PATTERN.match(data) || {}
		if (match && range) {
			writeFileSync(
				envDtsPath,
				data.slice(0, range[0]) +
					createTypeWrapper(types) +
					data.slice(range[1]),
			)
		} else {
			appendFileSync(envDtsPath, `\n\n${createTypeWrapper(types)}\n`)
		}
		return
	}

	writeFileSync(
		envDtsPath,
		`/// <reference types="astro/client" />\n\n${createTypeWrapper(
			types,
		)}\n`,
	)
}

function createTypeWrapper(types: string) {
	return `// ###> astro-i18n/type-generation ###\n${types}\n// ###< astro-i18n/type-generation ###`
}

function createRouteParametersType(typeName: string, routes: string[]) {
	let type = `type ${typeName} = {`

	for (const route of routes) {
		const parameters = extractRouteParameters(route)
		if (parameters.length === 0) {
			type += `"${route}":undefined;`
			continue
		}
		let object = "{"
		for (const param of parameters) {
			object += `"${param}":unknown;`
		}
		object += "}"
		type += `"${route}":${object};`
	}

	return `${type}}`
}

function createTranslationVariablesType(
	typeName: string,
	translationProperties: Record<string, TranslationVariables>,
) {
	let type = `type ${typeName} = {`

	for (const [key, props] of Object.entries(translationProperties)) {
		const { interpolationVars, variantVars, isVariantRequired } = props
		let object = "{"

		for (const interpolationVar of interpolationVars) {
			object += `"${interpolationVar}"?:unknown;`
		}

		if (variantVars.length > 0) {
			object += `"${VARIANT_PRIORITY_KEY}"?:number;`
		}

		for (const { name, values } of variantVars) {
			const variantTypes = new Set<string>()

			for (const value of values) {
				if (!value && typeof value === "object") {
					variantTypes.add("null")
					continue
				}
				variantTypes.add(typeof value)
			}

			object += `"${name}"?:${[...variantTypes].join("|")};`
		}

		object += !isVariantRequired || object === "{" ? `}|undefined` : `}`

		type += `"${key}":${object};`
	}

	return `${type}}`.replaceAll("{}", "object")
}

export default cmd

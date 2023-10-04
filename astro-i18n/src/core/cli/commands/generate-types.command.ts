import { toPosixPath } from "@lib/async-node/functions/path.functions"
import { isDirectory } from "@lib/async-node/functions/fs.functions"
import InvalidCommand from "@src/core/cli/errors/invalid-command.error"
import RootNotFound from "@src/core/config/errors/root-not-found.error"
import { astroI18n } from "@src/core/state/singletons/astro-i18n.singleton"
import type { Command, ParsedArgv } from "@lib/argv/types"
import type { TranslationVariables } from "@src/core/translation/types"
import { VARIANT_PRIORITY_KEY } from "@src/core/translation/constants/variant.constants"
import { extractRouteParameters } from "@src/core/routing/functions"

const cmd = {
	name: "generate:types",
	options: [],
} as const satisfies Command

export async function generateTypes({ command, args }: ParsedArgv) {
	if (command !== cmd.name) throw new InvalidCommand()

	const root = await toPosixPath(args[0] || process.cwd())
	if (!(await isDirectory(root))) throw new RootNotFound()

	await astroI18n.initialize()

	const translationVariables =
		astroI18n.internals.translations.getLocaleTranslationVariables(
			astroI18n.primaryLocale,
		)
	const routes = astroI18n.internals.translations.getRouteGroups()

	let types = `type PrimaryLocale = ${astroI18n.primaryLocale}\n`
	types += `type SecondaryLocales = ${astroI18n.secondaryLocales}\n`
	types += `type Locale = ${astroI18n.locales.join("|")}\n`
	types += `${createRouteParametersType("RouteParameters", routes)}\n`
	types += `type Route = keyof RouteParameters\n`
	types += `${createTranslationVariablesType(
		"TranslationVariables",
		translationVariables,
	)}\n`
	types += `type Translation = keyof TranslationVariables\n`

	console.log(types)
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

/*
type DefaultLangCode = "fr"
type SupportedLangCode = "en"
type LangCode = DefaultLangCode | SupportedLangCode
type RouteUri = | "/articles/[slug]" | "/articles" | "/agments/[slug]" | "/agments" | "/references" | "/veille" | "/" | "/plan-du-site" 
type RouteParams = {"/articles/[slug]": { "slug": string; }; "/articles": undefined; "/agments/[slug]": { "slug": string; }; "/agments": undefined; "/references": undefined; "/veille": undefined; "/": undefined; "/plan-du-site": undefined; }
type TranslationPath = "accueil" | "tagline" | "copyright" | "contact.title" | "contact.email" | "contact.tel" | "contenuVide" | "header.skipLink" | "header.mainNav" | "header.homeLink" | "sitemap" | "prevNext.contenus" | "prevNext.precedent" | "prevNext.suivant" | "article.titre" | "article.tagline" | "article.published" | "meta.publication" | "meta.modification" | "meta.credit" | "fragments.titre" | "fragments.tagline" | "references.titre" | "references.slug" | "references.cta" | "references.tagline" | "veille.titre" | "veille.tagline" | "erreur.introuvable" | "erreur.autre" | "erreur.lienRetour" | "seo.meta.description" | "seo.article.title" | "seo.article.description" | "seo.code.title" | "seo.code.description" | "seo.references.title" | "seo.references.description" | "index.articles.pageName" | "index.articles.subtitle" | "index.fragments.pageName" | "index.fragments.subtitle" | "index.references.pageName" | "index.references.subtitle" | "index.veille.pageName" | "index.veille.subtitle" | "index.title" | "index.subtitle" | "index.quoi" | "index.comment" | "index.opensource" | "index.writing" | "index.latestProjects" | "index.latestArticles" | "index.allProjects" | "index.allArticles" | "index.latestSnippets" | "index.allSnippets" | "index.toc" | "contact.contenuVide"
type TranslationOptions = { "accueil": {} | undefined; "tagline": {} | undefined; "copyright": {} | undefined; "contact.title": {} | undefined; "contact.email": {} | undefined; "contact.tel": {} | undefined; "contenuVide": {} | undefined; "header.skipLink": {} | undefined; "header.mainNav": {} | undefined; "header.homeLink": {} | undefined; "sitemap": {} | undefined; "prevNext.contenus": {} | undefined; "prevNext.precedent": {} | undefined; "prevNext.suivant": {} | undefined; "article.titre": {} | undefined; "article.tagline": {} | undefined; "article.published": { datetime: unknown; options: unknown; }; "meta.publication": {} | undefined; "meta.modification": {} | undefined; "meta.credit": {} | undefined; "fragments.titre": {} | undefined; "fragments.tagline": {} | undefined; "references.titre": {} | undefined; "references.slug": {} | undefined; "references.cta": {} | undefined; "references.tagline": {} | undefined; "veille.titre": {} | undefined; "veille.tagline": {} | undefined; "erreur.introuvable": {} | undefined; "erreur.autre": {} | undefined; "erreur.lienRetour": {} | undefined; "seo.meta.description": {} | undefined; "seo.article.title": {} | undefined; "seo.article.description": {} | undefined; "seo.code.title": {} | undefined; "seo.code.description": {} | undefined; "seo.references.title": {} | undefined; "seo.references.description": {} | undefined; "index.articles.pageName": {} | undefined; "index.articles.subtitle": {} | undefined; "index.fragments.pageName": {} | undefined; "index.fragments.subtitle": {} | undefined; "index.references.pageName": {} | undefined; "index.references.subtitle": {} | undefined; "index.veille.pageName": {} | undefined; "index.veille.subtitle": {} | undefined; "index.title": {} | undefined; "index.subtitle": {} | undefined; "index.quoi": {} | undefined; "index.comment": {} | undefined; "index.opensource": {} | undefined; "index.writing": {} | undefined; "index.latestProjects": {} | undefined; "index.latestArticles": {} | undefined; "index.allProjects": {} | undefined; "index.allArticles": {} | undefined; "index.latestSnippets": {} | undefined; "index.allSnippets": {} | undefined; "index.toc": {} | undefined; "contact.contenuVide": {} | undefined; }


`declare module "${PACKAGE_NAME}" {
	export * from "${PACKAGE_NAME}/"
	
	export function l<Uri extends RouteUri>(
		route: Uri | string & {},
		...args: Uri extends keyof RouteParams
			? undefined extends RouteParams[Uri]
				? [params?: Record<string, string>, targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
				: [params: RouteParams[Uri], targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
			: [params?: Record<string, string>, targetLangCode?: ${LANG_CODE}, routeLangCode?: ${LANG_CODE}]
	): string
	
	export function t<Path extends TranslationPath>(
		path: Path | string & {},
		...args: undefined extends TranslationOptions[Path]
			? [options?: keyof TranslationOptions extends Path ? Record<string, unknown> : TranslationOptions[Path], langCode?: ${LANG_CODE}]
			: [options: TranslationOptions[Path], langCode?: ${LANG_CODE}]
	): string
	
	export function extractRouteLangCode(route: string): ${LANG_CODE} | undefined
	
	type ${TRANSLATION} = string | { [translationKey: string]: string | ${TRANSLATION} }
	type ${TRANSLATIONS} = { [langCode: string]: Record<string, ${TRANSLATION}> }
	type ${ROUTE_TRANSLATIONS} = { [langCode: string]: Record<string, string> }
	type ${INTERPOLATION_FORMATTER} = (value: unknown, ...args: unknown[]) => string
	class ${ASTRO_I18N} {
		defaultLangCode: ${DEFAULT_LANG_CODE}
		supportedLangCodes: ${SUPPORTED_LANG_CODE}[]
		showDefaultLangCode: boolean
		translations: ${TRANSLATIONS}
		routeTranslations: ${ROUTE_TRANSLATIONS}
		get langCodes(): ${LANG_CODE}[]
		get langCode(): ${LANG_CODE}
		set langCode(langCode: ${LANG_CODE})
		get formatters(): Record<string, ${INTERPOLATION_FORMATTER}>
		init(Astro: { url: URL }, formatters?: Record<string, ${INTERPOLATION_FORMATTER}>): void
		addTranslations(translations: ${TRANSLATIONS}): void
		addRouteTranslations(routeTranslations: ${ROUTE_TRANSLATIONS}): void
		getFormatter(name: string): ${INTERPOLATION_FORMATTER} | undefined
		setFormatter(name: string, formatter: ${INTERPOLATION_FORMATTER}): void
		deleteFormatter(name: string): void
	}
	export const astroI18n: AstroI18n
}`
*/

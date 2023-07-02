import type { AstroIntegration } from "astro"
import type { defineMiddleware } from "astro/middleware"

export type AstroMiddleware = Parameters<typeof defineMiddleware>[0]

export type AstroHooks = {
	"config:setup": NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
	"config:done": NonNullable<AstroIntegration["hooks"]["astro:config:done"]>
	"server:setup": NonNullable<AstroIntegration["hooks"]["astro:server:setup"]>
	"server:start": NonNullable<AstroIntegration["hooks"]["astro:server:start"]>
	"server:done": NonNullable<AstroIntegration["hooks"]["astro:server:done"]>
	"build:start": NonNullable<AstroIntegration["hooks"]["astro:build:start"]>
	"build:setup": NonNullable<AstroIntegration["hooks"]["astro:build:setup"]>
	"build:generated": NonNullable<
		AstroIntegration["hooks"]["astro:build:generated"]
	>
	"build:ssr": NonNullable<AstroIntegration["hooks"]["astro:build:ssr"]>
	"build:done": NonNullable<AstroIntegration["hooks"]["astro:build:done"]>
}

export type GetStaticPathsProps = {
	paginate: Function
	rss: Function
}

export interface AstroContent {
	id: string
	collection: string
	data: Record<string, any>
	slug: string
	body: string
}

export interface AstroGlobal {
	clientAddress: string
	cookies: AstroCookies
	url: URL
	params: Record<string, string | undefined>
	props: Record<string, any>
	request: Request
	response: ResponseInit & {
		readonly headers: Headers
	}
	redirect(path: string, status?: 301 | 302 | 303 | 307 | 308): Response
	slots: Record<string, true | undefined> & {
		has(slotName: string): boolean
		render(slotName: string, args?: any[]): Promise<string>
	}
	site: URL | undefined
	generator: string
	__renderMarkdown?: (md: string) => Promise<string>
}

type AstroCookies = {
	delete(
		key: string,
		options?: Pick<AstroCookieSetOptions, "domain" | "path">,
	): void
	get(key: string): {
		value: string | undefined
		json(): any
		number(): number
		boolean(): boolean
	}
	has(key: string): boolean
	set(
		key: string,
		value: string | Record<string, any>,
		options?: AstroCookieSetOptions,
	): void
	headers(): Generator<string, void, unknown>
}

interface AstroCookieSetOptions {
	domain?: string
	expires?: Date
	httpOnly?: boolean
	maxAge?: number
	path?: string
	sameSite?: boolean | "lax" | "none" | "strict"
	secure?: boolean
}

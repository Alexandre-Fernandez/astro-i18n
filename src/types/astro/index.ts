import type { AstroIntegration } from "astro"

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

require("esbuild").build({
	entryPoints: ["src/astro/index.ts"],
	minify: true,
	outdir: "dist/src/astro",
	platform: "node",
	target: "node14",
	format: "esm",
	outExtension: {
		".js": ".mjs",
	},
	sourcemap: false,
	sourcesContent: false,
})

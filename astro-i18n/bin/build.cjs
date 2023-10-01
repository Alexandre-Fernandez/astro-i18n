const esbuild = require("esbuild")

esbuild.build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	minify: true,
	external: ["esbuild"],
	outdir: "dist/src",
	platform: "node",
	target: "node14",
	format: "esm",
	outExtension: {
		".js": ".mjs",
	},
	sourcemap: false,
	sourcesContent: false,
})

esbuild.build({
	entryPoints: ["src/bin.ts"],
	bundle: true,
	minify: true,
	external: ["esbuild"],
	outdir: "dist/src",
	platform: "node",
	target: "node14",
	format: "cjs",
	outExtension: {
		".js": ".cjs",
	},
	sourcemap: false,
	sourcesContent: false,
})

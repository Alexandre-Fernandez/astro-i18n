const esbuild = require("esbuild")

// core
esbuild.build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	minify: true,
	external: ["esbuild"],
	outdir: "dist/src",
	platform: "node",
	target: "node18",
	format: "esm",
	sourcemap: false,
	sourcesContent: false,
})

// cli
esbuild.build({
	entryPoints: ["src/bin.ts"],
	bundle: true,
	minify: true,
	external: ["esbuild"],
	outdir: "dist/src",
	platform: "node",
	target: "node18",
	format: "cjs",
	outExtension: {
		".js": ".cjs",
	},
	sourcemap: false,
	sourcesContent: false,
})

// astro components
esbuild.build({
	entryPoints: ["src/astro/index.ts"],
	minify: true,
	outdir: "dist/src/astro",
	platform: "node",
	target: "node18",
	format: "esm",
	sourcemap: false,
	sourcesContent: false,
})

require("esbuild").build({
	entryPoints: ["src/cli/index.ts"],
	bundle: true,
	minify: true,
	external: ["esbuild", "get-file-exports"],
	outdir: "dist/src/cli",
	platform: "node",
	target: "node14",
	format: "cjs",
	outExtension: {
		".js": ".cjs",
	},
	sourcemap: false,
	sourcesContent: false,
})

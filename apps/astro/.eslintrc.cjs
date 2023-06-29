module.exports = {
	extends: ["af-typescript"],
	parserOptions: {
		project: "./tsconfig.json",
		tsconfigRootDir: __dirname,
	},
	overrides: [
		{
			files: ["*.astro"],
			parser: "astro-eslint-parser",
			parserOptions: {
				extraFileExtensions: [".astro"],
				project: `${__dirname}/tsconfig.json`,
			},
		},
	],
	rules: {
		"unicorn/text-encoding-identifier-case": "off",
	},
}

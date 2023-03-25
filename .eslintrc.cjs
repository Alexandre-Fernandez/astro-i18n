module.exports = {
	extends: ["af-typescript"],
	root: true,
	env: {
		node: true,
	},
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 2020,
		project: ["tsconfig.json"],
	},
	ignorePatterns: ["eslintrc.*"],
}

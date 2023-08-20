/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.test.json",
			},
		],
	},
	moduleNameMapper: {
		"^@src$": "<rootDir>/src",
		"^@src\\/(.+)$": "<rootDir>/src/$1",
		"^@lib$": "<rootDir>/lib",
		"^@lib\\/(.+)$": "<rootDir>/lib/$1",
	},
}

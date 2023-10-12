const { readFileSync, writeFileSync } = require("fs")
const { join } = require("path")
const { execSync } = require("child_process")

if (!Array.isArray(process.argv)) throw new Error("Cannot parse argv.\n")

/** @type {string} */
const mode = String(process.argv.slice(2)[0]).toUpperCase()

const ASTRO_I18N_DIR = join(__dirname, "..")
const PACKAGE_JSON_PATH = join(ASTRO_I18N_DIR, "package.json")

/** @type {{ version: string }} */
const packageJson = JSON.parse(
	readFileSync(PACKAGE_JSON_PATH, { encoding: "utf8" }),
)
if (
	typeof packageJson !== "object" ||
	typeof packageJson.version !== "string"
) {
	throw new Error("Invalid package.json.\n")
}

const [major, minor, patch] = packageJson.version
	.split(".")
	.map((version) => parseInt(version))

switch (mode) {
	case "PATCH": {
		update(major, minor, patch + 1)
		break
	}
	case "MINOR": {
		update(major, minor + 1, patch)
		break
	}
	case "MAJOR": {
		update(major + 1, minor, patch)
		break
	}
	default: {
		throw new Error(
			'`undefined` or invalid argument.\n\tValid values are: "patch", "minor" or "major" (case insensitive).\n',
		)
	}
}

/**
 * @param {number} major
 * @param {number} minor
 * @param {number} patch
 */
function update(major, minor, patch) {
	const version = `${major}.${minor}.${patch}`
	packageJson.version = version
	writeFileSync(
		PACKAGE_JSON_PATH,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
	)
	execSync(`git add "${ASTRO_I18N_DIR}/package.json"`, {
		cwd: ASTRO_I18N_DIR,
	})
	execSync(`git commit -m "${version}"`, { cwd: ASTRO_I18N_DIR })
}

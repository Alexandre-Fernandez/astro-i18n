const { existsSync, lstatSync, copyFileSync } = require("fs")
const { join } = require("path")

const README = "README.md"
const ASTRO_I18N_DIR = join(__dirname, "..")
const README_PATH = join(ASTRO_I18N_DIR, README)

if (existsSync(README_PATH) && lstatSync(README_PATH).isFile()) {
	const MONOREPO_README = join(ASTRO_I18N_DIR, "..", README)
	copyFileSync(README_PATH, MONOREPO_README)
}

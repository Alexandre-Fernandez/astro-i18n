const { existsSync, lstatSync, copyFileSync } = require("fs")
const { join } = require("path")

const README = "README.md"
const ASTRO_I18N_DIR = join(__dirname, "..")

const readme = join(ASTRO_I18N_DIR, README)
if (existsSync(readme) && lstatSync(readme).isFile()) {
	const MONOREPO_DIR = join(ASTRO_I18N_DIR, "..")
	copyFileSync(readme, join(MONOREPO_DIR, README))
}

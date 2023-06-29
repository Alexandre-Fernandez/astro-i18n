const { existsSync, lstatSync, copyFileSync } = require("fs")
const { join } = require("path")

const README = "README.md"
const ASTRO_I18N_DIR = join(__dirname, "..")
const MONOREPO_DIR = join(ASTRO_I18N_DIR, "..")

const readme = join(MONOREPO_DIR, README)
if (existsSync(readme) && lstatSync(readme).isFile()) {
	copyFileSync(readme, join(ASTRO_I18N_DIR, README))
}

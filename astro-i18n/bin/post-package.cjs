const { existsSync, lstatSync, copyFileSync, unlinkSync } = require("fs")
const { join } = require("path")

const ASTRO_I18N_DIR = join(__dirname, "..")
const PACKAGE_JSON_PATH = join(ASTRO_I18N_DIR, "package.json")

const BACKUP_PATH = `${PACKAGE_JSON_PATH}.bk`
if (existsSync(BACKUP_PATH) && lstatSync(BACKUP_PATH).isFile()) {
	copyFileSync(BACKUP_PATH, PACKAGE_JSON_PATH)
	unlinkSync(BACKUP_PATH)
}

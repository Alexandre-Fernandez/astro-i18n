const {
	readFileSync,
	existsSync,
	lstatSync,
	copyFileSync,
	writeFileSync,
} = require("fs")
const { join } = require("path")

console.log("> pre-publishing")

const PACKAGE_JSON_DIR = join(__dirname, "..")
const BUILD_ENTRY_POINT = join("src", "index.ts")
const BUILD_OUT_DIR = join("dist", "src")
const BUILD_OUT_EXTENSION = ".mjs"
const BACKUP_EXTENSION = ".bk"

const [, filename] = BUILD_ENTRY_POINT.match(/([^\/]+)\..{1,3}$/)
if (!filename) throw new Error("Invalid entry point.")

const packageJsonPath = join(PACKAGE_JSON_DIR, "package.json")
if (!existsSync(packageJsonPath) || !lstatSync(packageJsonPath).isFile()) {
	throw new Error("Missing or invalid `package.json`.")
}

const backupPath = `${packageJsonPath}${BACKUP_EXTENSION}`
copyFileSync(packageJsonPath, backupPath)

const main = join(BUILD_OUT_DIR, `${filename}${BUILD_OUT_EXTENSION}`)
const types = join(BUILD_OUT_DIR, `${filename}.d.ts`)

const packageJson = JSON.parse(
	readFileSync(packageJsonPath, { encoding: "utf8" }),
)

packageJson.main = main
packageJson.types = types

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, "\t"), {
	encoding: "utf8",
})

console.log("> pre-publishing successful !\n")

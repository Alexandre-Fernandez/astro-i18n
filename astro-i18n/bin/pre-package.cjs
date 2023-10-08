const {
	readFileSync,
	existsSync,
	lstatSync,
	copyFileSync,
	writeFileSync,
} = require("fs")
const { join } = require("path")

const ASTRO_I18N_DIR = join(__dirname, "..")
const PACKAGE_JSON_PATH = join(ASTRO_I18N_DIR, "package.json")
const BUILD_SRC_DIR = join("dist", "src")
const BUILD_ASTRO_DIR = join(BUILD_SRC_DIR, "astro")

if (!existsSync(PACKAGE_JSON_PATH) || !lstatSync(PACKAGE_JSON_PATH).isFile()) {
	throw new Error("Missing `package.json`.")
}

// get package.json
const packageJson = JSON.parse(
	readFileSync(PACKAGE_JSON_PATH, { encoding: "utf8" }),
)

// backup
copyFileSync(PACKAGE_JSON_PATH, `${PACKAGE_JSON_PATH}.bk`)

// update to build path
packageJson.main = "./" + join(BUILD_SRC_DIR, `index.mjs`)
packageJson.types = "./" + join(BUILD_SRC_DIR, `index.d.ts`)
packageJson.exports["."].import = "./" + join(BUILD_SRC_DIR, `index.mjs`)
packageJson.exports["."].types = "./" + join(BUILD_SRC_DIR, `index.d.ts`)
packageJson.exports["./components"].import =
	"./" + join(BUILD_ASTRO_DIR, `index.mjs`)
packageJson.exports["./components"].types =
	"./" + join(BUILD_ASTRO_DIR, `index.d.ts`)

writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, "\t"), {
	encoding: "utf8",
})

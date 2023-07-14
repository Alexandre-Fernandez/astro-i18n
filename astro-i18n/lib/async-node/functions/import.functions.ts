import AsyncNode from "@lib/async-node/classes/async-node.class"
import FileNotFound from "@lib/async-node/errors/file-not-found.error"
import InvalidFileType from "@lib/async-node/errors/invalid-file-type.error"
import { isFile } from "@lib/async-node/functions/fs.functions"

export async function importScript(filename: string) {
	const esbuild = await import("esbuild")

	const supportedExtensions = /\.(js|cjs|mjs|ts)$/
	if (!isFile(filename)) throw new FileNotFound(filename)
	if (!supportedExtensions.test(filename)) {
		throw new InvalidFileType(["js", "cjs", "mjs", "ts"])
	}

	const { outputFiles } = await esbuild.build({
		entryPoints: [filename],
		bundle: true,
		external: ["esbuild"],
		format: "cjs",
		platform: "node",
		write: false,
	})
	const commonJs = new TextDecoder().decode(outputFiles[0]?.contents)

	return commonJs
		? extractCommonJsExports(
				commonJs,
				filename.replace(supportedExtensions, ".cjs"),
		  )
		: {}
}

async function extractCommonJsExports(commonJs: string, filename: string) {
	const Module = await AsyncNode.module
	const dirname = filename.split("/").slice(0, -1).join("/")
	const global = {
		module: new Module(filename, require.main),
		require(id: string) {
			return this.module.require(id)
		},
	}
	// eslint-disable-next-line no-underscore-dangle
	global.module.paths = Module._nodeModulePaths(dirname)
	global.module.filename = filename
	global.module.exports = {}
	global.require = (id) => global.module.require(id)
	Object.assign(global.require, {
		// eslint-disable-next-line no-underscore-dangle
		resolve: (req: string) => Module._resolveFilename(req, global.module),
	})
	// eslint-disable-next-line no-new-func
	new Function(
		"exports",
		"require",
		"module",
		"__filename",
		"__dirname",
		commonJs,
	)(global.module.exports, global.require, global.module, filename, dirname)

	return global.module.exports
}

export type AsyncNodeJsCache = {
	path: typeof import("node:path")
	fs: typeof import("node:fs")
	url: typeof import("node:url")
	module: typeof import("node:module") & {
		Module: {
			_nodeModulePaths: (dir: string) => string[]
			_resolveFilename: (request: string, module: any) => string
		}
	}
}

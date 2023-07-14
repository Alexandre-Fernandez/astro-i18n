export type AsyncNodeJsCache = {
	path: typeof import("node:path")
	fs: typeof import("node:fs")
	url: typeof import("node:url")
	module: NodeModule
}

type NodeModule = typeof import("node:module") & {
	_nodeModulePaths: (dir: string) => string[]
	_resolveFilename: (request: string, module: any) => string
}
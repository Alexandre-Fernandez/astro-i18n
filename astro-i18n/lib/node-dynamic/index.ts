export async function getDirname(importMetaUrl: string) {
	const [{ dirname }, { fileURLToPath }] = await Promise.all([
		import("node:path"),
		import("node:url"),
	])
	return dirname(fileURLToPath(importMetaUrl))
}

export async function getFilename(importMetaUrl: string) {
	const { fileURLToPath } = await import("node:url")
	return fileURLToPath(importMetaUrl)
}

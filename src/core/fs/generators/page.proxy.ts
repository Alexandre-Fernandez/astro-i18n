import { join, posix, sep } from "node:path"
import {
	removeLeadingSep,
	removeTrailingSep,
	writeNestedFile,
} from "$lib/filesystem"

export function generatePageProxy(
	pagesDirectory: string,
	pagePath: string,
	proxyPath: string,
	importGetStaticPaths: boolean,
	exportPrerender: boolean,
) {
	const depth = Math.max(
		0,
		removeLeadingSep(removeTrailingSep(proxyPath)).split(sep).length - 1,
	)
	const importPath = `"${posix.join(
		"../".repeat(depth),
		pagePath.replaceAll("\\", "/"),
	)}"\n\n`

	let pageProxy = `---\nimport Page from ${importPath}`
	if (importGetStaticPaths) {
		pageProxy += `export { getStaticPaths } from ${importPath}`
	}
	if (exportPrerender) {
		pageProxy += "export const prerender = true\n\n"
	}

	pageProxy += "const { props } = Astro\n---\n\n<Page {...props} />"

	writeNestedFile(join(pagesDirectory, proxyPath), pageProxy)
}

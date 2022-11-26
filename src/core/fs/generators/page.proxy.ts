import { join, sep } from "node:path"
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
) {
	const depth = Math.max(
		0,
		removeLeadingSep(removeTrailingSep(proxyPath)).split(sep).length - 1,
	)
	const importPath = `"${join("../".repeat(depth), pagePath)}"\n\n`

	let pageProxy = `---\nimport Page from ${importPath}`
	if (importGetStaticPaths) {
		pageProxy += `export { getStaticPaths } from ${importPath}`
	}
	pageProxy += "const { props } = Astro\n---\n\n<Page {...props} />"

	writeNestedFile(join(pagesDirectory, proxyPath), pageProxy)
}

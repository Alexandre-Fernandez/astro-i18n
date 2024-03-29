import type { AsyncNodeJsCache } from "@lib/async-node/types"

class AsyncNode {
	static #cache: Partial<AsyncNodeJsCache> = {}

	static get path() {
		return this.#getModule("path")
	}

	static get posix() {
		// eslint-disable-next-line github/no-then
		return this.path.then(({ posix }) => posix)
	}

	static get fs() {
		return this.#getModule("fs")
	}

	static get url() {
		return this.#getModule("url")
	}

	static get module() {
		return this.#getModule("module")
	}

	static async #getModule<T extends keyof AsyncNodeJsCache>(
		name: T,
	): Promise<AsyncNodeJsCache[T]> {
		if (this.#cache[name]) return this.#cache[name]!

		const module: AsyncNodeJsCache[T] = await import(
			`node:${name}` /* @vite-ignore */
		)
		this.#cache[name] = module

		return module
	}
}

export default AsyncNode

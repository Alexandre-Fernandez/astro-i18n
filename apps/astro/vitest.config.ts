import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig, type UserConfig } from "vitest/config"

export default defineConfig({
	test: {
		...configDefaults,
		setupFiles: ["tests/index.ts"],
	},
	plugins: [(tsconfigPaths as any)()],
}) as UserConfig

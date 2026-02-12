import { defineConfig } from "vitest/config"

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/packages/nx-plugins",
  plugins: [],
  test: {
    name: "@leancodepl/nx-plugins",
    watch: false,
    globals: true,
    environment: "node",
    include: ["{src,__tests__}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: "../../coverage/packages/nx-plugins",
      provider: "v8" as const,
    },
  },
}))

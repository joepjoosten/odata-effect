import * as path from "node:path"
import type { UserConfig } from "vitest/config"

const alias = (pkgName: string, scope = "@odata-effect") => {
  const target = process.env.TEST_DIST !== undefined ? "dist/dist/esm" : "src"
  return ({
    [`${scope}/${pkgName}/test`]: path.join(__dirname, "packages", pkgName, "test"),
    [`${scope}/${pkgName}`]: path.join(__dirname, "packages", pkgName, target)
  })
}

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: UserConfig = {
  esbuild: {
    target: "es2020"
  },
  optimizeDeps: {
    exclude: ["bun:sqlite"]
  },
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    fakeTimers: {
      toFake: undefined
    },
    sequence: {
      concurrent: true
    },
    include: ["test/**/*.test.ts"],
    alias: {
      ...alias("odata-effect"),
      ...alias("odata-effect-promise"),
      ...alias("odata-effect-generator")
    }
  }
}

export default config

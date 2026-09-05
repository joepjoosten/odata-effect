/**
 * Self-contained ESM package configuration for generated clients.
 * @since 1.0.0
 */
import type { DataModel } from "../model/DataModel.js"

export interface PackageConfig {
  readonly packageName: string
  readonly serviceName: string
}

/** Generate a standalone package manifest. @since 1.0.0 @category generation */
export const generatePackageJson = (dataModel: DataModel, config: PackageConfig): string =>
  JSON.stringify(
    {
      name: config.packageName,
      version: "0.0.0",
      type: "module",
      license: "MIT",
      description: `Effect-based OData client for ${dataModel.serviceName} service`,
      sideEffects: false,
      files: ["dist"],
      main: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
        "./*": { types: "./dist/*.d.ts", import: "./dist/*.js" }
      },
      publishConfig: { access: "public" },
      scripts: {
        build: "tsc -p tsconfig.build.json",
        check: "tsc -p tsconfig.json",
        test: "node --test",
        prepack: "npm run build"
      },
      dependencies: {
        "@odata-effect/odata-effect": "^1.3.0",
        "@odata-effect/odata-effect-promise": "^4.0.8",
        effect: "4.0.0-rc.111"
      },
      devDependencies: {
        typescript: "^5.6.3",
        "@types/node": "^22.8.5"
      }
    },
    null,
    2
  )

/** Generate the package check configuration. @since 1.0.0 @category generation */
export const generateTsconfig = (): string => JSON.stringify({ extends: "./tsconfig.src.json" }, null, 2)

/** Generate shared local compiler settings. @since 1.0.0 @category generation */
export const generateTsconfigSrc = (): string =>
  JSON.stringify(
    {
      include: ["src"],
      compilerOptions: {
        strict: true,
        exactOptionalPropertyTypes: true,
        skipLibCheck: true,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        types: ["node"],
        rootDir: "src",
        noEmit: true
      }
    },
    null,
    2
  )

/** Generate a local test type-check configuration. @since 1.0.0 @category generation */
export const generateTsconfigTest = (): string =>
  JSON.stringify(
    {
      extends: "./tsconfig.src.json",
      include: ["src", "test"],
      compilerOptions: { rootDir: "." }
    },
    null,
    2
  )

/** Generate the distributable ESM build configuration. @since 1.0.0 @category generation */
export const generateTsconfigBuild = (): string =>
  JSON.stringify(
    {
      extends: "./tsconfig.src.json",
      compilerOptions: {
        noEmit: false,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: "dist"
      }
    },
    null,
    2
  )

/** Generate a local Vitest configuration. @since 1.0.0 @category generation */
export const generateVitestConfig = (): string =>
  `import { defineConfig } from "vitest/config"

export default defineConfig({ test: { include: ["test/**/*.test.ts"] } })
`

/**
 * Generator for package configuration files.
 *
 * @since 1.0.0
 */
import type { DataModel } from "../model/DataModel.js"

export interface PackageConfig {
  readonly packageName: string
  readonly serviceName: string
}

/**
 * Generate package.json content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generatePackageJson = (
  dataModel: DataModel,
  config: PackageConfig
): string => {
  const packageJson = {
    name: config.packageName,
    version: "0.0.0",
    type: "module",
    license: "MIT",
    description: `Effect-based OData client for ${dataModel.serviceName} service`,
    publishConfig: {
      access: "public",
      directory: "dist"
    },
    scripts: {
      codegen: "build-utils prepare-v2",
      build: "pnpm build-esm && pnpm build-annotate && pnpm build-cjs && build-utils pack-v2",
      "build-esm": "tsc -b tsconfig.build.json",
      "build-cjs":
        "babel build/esm --plugins @babel/transform-export-namespace-from --plugins @babel/transform-modules-commonjs --out-dir build/cjs --source-maps",
      "build-annotate": "babel build/esm --plugins annotate-pure-calls --out-dir build/esm --source-maps",
      check: "tsc -b tsconfig.json",
      test: "vitest",
      coverage: "vitest --coverage"
    },
    dependencies: {
      "@effect/platform": "^0.94.0",
      "@odata-effect/odata-effect": "workspace:*",
      "@odata-effect/odata-effect-promise": "workspace:*",
      effect: "^3.10.7"
    },
    devDependencies: {
      "@odata-effect/odata-effect": "workspace:*",
      "@odata-effect/odata-effect-promise": "workspace:*"
    },
    effect: {
      generateExports: {
        include: ["**/*.ts"]
      },
      generateIndex: {
        include: ["**/*.ts"]
      }
    }
  }

  return JSON.stringify(packageJson, null, 2)
}

/**
 * Generate tsconfig.json content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateTsconfig = (): string => {
  const tsconfig = {
    extends: "../../tsconfig.base.json",
    include: [],
    references: [
      { path: "tsconfig.src.json" },
      { path: "tsconfig.test.json" }
    ]
  }

  return JSON.stringify(tsconfig, null, 2)
}

/**
 * Generate tsconfig.src.json content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateTsconfigSrc = (): string => {
  const tsconfig = {
    extends: "../../tsconfig.base.json",
    include: ["src"],
    references: [
      { path: "../ODataEffect/tsconfig.src.json" },
      { path: "../ODataEffectPromise/tsconfig.src.json" }
    ],
    compilerOptions: {
      types: ["node"],
      outDir: "build/src",
      tsBuildInfoFile: ".tsbuildinfo/src.tsbuildinfo",
      rootDir: "src"
    }
  }

  return JSON.stringify(tsconfig, null, 2)
}

/**
 * Generate tsconfig.test.json content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateTsconfigTest = (): string => {
  const tsconfig = {
    extends: "../../tsconfig.base.json",
    include: ["test"],
    references: [
      { path: "tsconfig.src.json" },
      { path: "../ODataEffect/tsconfig.src.json" },
      { path: "../ODataEffectPromise/tsconfig.src.json" }
    ],
    compilerOptions: {
      types: ["node"],
      tsBuildInfoFile: ".tsbuildinfo/test.tsbuildinfo",
      rootDir: "test",
      noEmit: true
    }
  }

  return JSON.stringify(tsconfig, null, 2)
}

/**
 * Generate tsconfig.build.json content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateTsconfigBuild = (): string => {
  const tsconfig = {
    extends: "./tsconfig.src.json",
    references: [
      { path: "../ODataEffect/tsconfig.build.json" },
      { path: "../ODataEffectPromise/tsconfig.build.json" }
    ],
    compilerOptions: {
      types: ["node"],
      tsBuildInfoFile: ".tsbuildinfo/build.tsbuildinfo",
      outDir: "build/esm",
      declarationDir: "build/dts",
      stripInternal: true
    }
  }

  return JSON.stringify(tsconfig, null, 2)
}

/**
 * Generate vitest.config.ts content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateVitestConfig = (): string => {
  return `import { mergeConfig, type UserConfigExport } from "vitest/config"
import shared from "../../vitest.shared.js"

const config: UserConfigExport = {}

export default mergeConfig(shared, config)
`
}

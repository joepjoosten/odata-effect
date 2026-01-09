/**
 * Main generator that orchestrates all code generation.
 *
 * @since 1.0.0
 */
import * as FileSystem from "@effect/platform/FileSystem"
import * as Path from "@effect/platform/Path"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import type { DataModel } from "../model/DataModel.js"
import { generateIndex } from "./IndexGenerator.js"
import { generateModels } from "./ModelsGenerator.js"
import { generateNavigations } from "./NavigationGenerator.js"
import { generateOperations } from "./OperationsGenerator.js"
import {
  generatePackageJson,
  generateTsconfig,
  generateTsconfigBuild,
  generateTsconfigSrc,
  generateTsconfigTest,
  generateVitestConfig,
  type PackageConfig
} from "./PackageGenerator.js"
import { generateQueryModels } from "./QueryModelsGenerator.js"
import { generateServiceFns } from "./ServiceFnGenerator.js"

/**
 * Generator configuration.
 *
 * @since 1.0.0
 * @category config
 */
export interface GeneratorConfig {
  readonly outputDir: string
  readonly packageName?: string
  readonly serviceName?: string
  readonly force?: boolean
  /** Generate only source files directly in outputDir (no package.json, tsconfig, src/ subdirectory) */
  readonly filesOnly?: boolean
}

/**
 * Error thrown during code generation.
 *
 * @since 1.0.0
 * @category errors
 */
export class GeneratorError extends Schema.TaggedError<GeneratorError>()(
  "GeneratorError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
  }
) {}

/**
 * Generated file result.
 */
interface GeneratedFile {
  readonly path: string
  readonly content: string
}

/**
 * Generate all code from a data model.
 *
 * @since 1.0.0
 * @category generation
 */
export const generate = (
  dataModel: DataModel,
  config: GeneratorConfig
): Effect.Effect<void, GeneratorError, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const outputDir = config.outputDir
    const serviceName = config.serviceName ?? dataModel.serviceName
    const packageName = config.packageName ?? `@template/${serviceName.toLowerCase()}-effect`
    const filesOnly = config.filesOnly ?? false

    // When filesOnly is true, output directly to outputDir; otherwise use outputDir/src
    const sourceDir = filesOnly ? outputDir : path.join(outputDir, "src")

    const packageConfig: PackageConfig = {
      packageName,
      serviceName
    }

    // Generate tree-shakable service function files
    const serviceResult = generateServiceFns(dataModel)

    // Generate operations file (FunctionImports, Functions, Actions)
    const operationsResult = generateOperations(dataModel)

    // Generate navigation builders
    const navigationResult = generateNavigations(dataModel)

    // Generate source files
    const sourceFiles: Array<GeneratedFile> = [
      {
        path: path.join(sourceDir, "Models.ts"),
        content: generateModels(dataModel)
      },
      {
        path: path.join(sourceDir, "QueryModels.ts"),
        content: generateQueryModels(dataModel)
      },
      // Services file (all entity CRUD services in one file)
      {
        path: path.join(sourceDir, serviceResult.servicesFile.fileName),
        content: serviceResult.servicesFile.content
      },
      // Operations file (only if there are unbound operations)
      ...(operationsResult.operationsFile
        ? [{
          path: path.join(sourceDir, operationsResult.operationsFile.fileName),
          content: operationsResult.operationsFile.content
        }]
        : []),
      // Navigation builder files
      ...navigationResult.navigationFiles.map((nav) => ({
        path: path.join(sourceDir, nav.fileName),
        content: nav.content
      })),
      {
        path: path.join(sourceDir, "index.ts"),
        content: generateIndex(dataModel)
      }
    ]

    // Package configuration files (only when not filesOnly)
    const packageFiles: Array<GeneratedFile> = filesOnly ? [] : [
      {
        path: path.join(outputDir, "package.json"),
        content: generatePackageJson(dataModel, packageConfig)
      },
      {
        path: path.join(outputDir, "tsconfig.json"),
        content: generateTsconfig()
      },
      {
        path: path.join(outputDir, "tsconfig.src.json"),
        content: generateTsconfigSrc()
      },
      {
        path: path.join(outputDir, "tsconfig.test.json"),
        content: generateTsconfigTest()
      },
      {
        path: path.join(outputDir, "tsconfig.build.json"),
        content: generateTsconfigBuild()
      },
      {
        path: path.join(outputDir, "vitest.config.ts"),
        content: generateVitestConfig()
      }
    ]

    const files = [...sourceFiles, ...packageFiles]

    // Create output directory
    yield* fs.makeDirectory(sourceDir, { recursive: true }).pipe(
      Effect.mapError((error) =>
        new GeneratorError({
          message: `Failed to create output directory: ${sourceDir}`,
          cause: error
        })
      )
    )

    // Write all files
    for (const file of files) {
      // Check if file exists and force is not set
      if (!config.force) {
        const exists = yield* fs.exists(file.path).pipe(
          Effect.mapError(() =>
            new GeneratorError({
              message: `Failed to check file existence: ${file.path}`
            })
          )
        )

        if (exists) {
          yield* Effect.logWarning(`Skipping existing file: ${file.path}`)
          continue
        }
      }

      yield* fs.writeFileString(file.path, file.content).pipe(
        Effect.mapError((error) =>
          new GeneratorError({
            message: `Failed to write file: ${file.path}`,
            cause: error
          })
        )
      )

      yield* Effect.logInfo(`Generated: ${file.path}`)
    }

    yield* Effect.logInfo(`Generation complete. Output: ${outputDir}`)
  })

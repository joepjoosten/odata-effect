/**
 * CLI for OData Effect Generator.
 *
 * @since 1.0.0
 */
import { Args, Command, Options } from "@effect/cli"
import * as FileSystem from "@effect/platform/FileSystem"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"

import { digestMetadata } from "./digester/Digester.js"
import { generate } from "./generator/Generator.js"
import type { NamingOverrides } from "./model/GeneratorConfig.js"
import { parseODataMetadata } from "./parser/XmlParser.js"

// ============================================================================
// Arguments and Options
// ============================================================================

const metadataPath = Args.path({ name: "metadata-path" }).pipe(
  Args.withDescription("Path to OData metadata XML file")
)

const outputDir = Args.path({ name: "output-dir" }).pipe(
  Args.withDescription("Directory for generated TypeScript files")
)

const serviceName = Options.text("service-name").pipe(
  Options.optional,
  Options.withDescription("Override service name (defaults to EntityContainer name)")
)

const packageName = Options.text("package-name").pipe(
  Options.optional,
  Options.withDescription("NPM package name (defaults to @template/<service-name>-effect)")
)

const force = Options.boolean("force").pipe(
  Options.withDefault(false),
  Options.withDescription("Overwrite existing files")
)

const filesOnly = Options.boolean("files-only").pipe(
  Options.withDefault(false),
  Options.withDescription("Generate only source files (no package.json, tsconfig, etc.) directly in output-dir")
)

const configOption = Options.text("config").pipe(
  Options.optional,
  Options.withDescription(
    `Config as JSON string or path to JSON file. Options: { esmExtensions?: boolean, overrides?: NamingOverrides }. Example: --config '{"esmExtensions": true}'`
  )
)

// ============================================================================
// Generate Command
// ============================================================================

/** Parse config from JSON string or file path */
const parseConfig = (
  configValue: string,
  fs: FileSystem.FileSystem
): Effect.Effect<{ esmExtensions?: boolean; overrides?: NamingOverrides }, Error> =>
  Effect.gen(function*() {
    // Try parsing as JSON first
    const trimmed = configValue.trim()
    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed) as { esmExtensions?: boolean; overrides?: NamingOverrides }
      } catch (e) {
        yield* Effect.fail(new Error(`Failed to parse config JSON: ${e}`))
      }
    }

    // Otherwise treat as file path
    yield* Console.log(`Loading config from: ${configValue}`)
    const configContent = yield* fs.readFileString(configValue).pipe(
      Effect.mapError((error) => new Error(`Failed to read config file: ${configValue}. ${error}`))
    )
    try {
      return JSON.parse(configContent) as { esmExtensions?: boolean; overrides?: NamingOverrides }
    } catch (e) {
      throw new Error(`Failed to parse config file: ${configValue}. ${e}`)
    }
  })

const generateCommand = Command.make(
  "generate",
  { metadataPath, outputDir, serviceName, packageName, force, filesOnly, configOption }
).pipe(
  Command.withDescription("Generate Effect OData client from metadata"),
  Command.withHandler((
    {
      configOption: cfgOption,
      filesOnly: onlyFiles,
      force: forceOverwrite,
      metadataPath: metaPath,
      outputDir: outDir,
      packageName: pkgName,
      serviceName: svcName
    }
  ) =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem

      // Load config if provided (JSON string or file path)
      let esmExtensions: boolean | undefined
      let overrides: NamingOverrides | undefined
      if (cfgOption._tag === "Some") {
        const parsed = yield* parseConfig(cfgOption.value, fs)
        esmExtensions = parsed.esmExtensions
        overrides = parsed.overrides
      }

      yield* Console.log(`Reading metadata from: ${metaPath}`)

      // Read metadata file
      const metadataContent = yield* fs.readFileString(metaPath).pipe(
        Effect.mapError((error) => new Error(`Failed to read metadata file: ${metaPath}. ${error}`))
      )

      yield* Console.log("Parsing metadata...")

      // Parse XML
      const edmx = yield* parseODataMetadata(metadataContent)

      yield* Console.log("Digesting metadata...")

      // Digest metadata with optional overrides
      const dataModel = yield* digestMetadata(edmx, overrides)

      yield* Console.log(`Detected OData ${dataModel.version}`)
      yield* Console.log(`Namespace: ${dataModel.namespace}`)
      yield* Console.log(`Service: ${dataModel.serviceName}`)
      yield* Console.log(`Entity Types: ${dataModel.entityTypes.size}`)
      yield* Console.log(`Complex Types: ${dataModel.complexTypes.size}`)
      yield* Console.log(`Enum Types: ${dataModel.enumTypes.size}`)
      yield* Console.log(`Entity Sets: ${dataModel.entitySets.size}`)

      yield* Console.log(`\nGenerating code to: ${outDir}`)

      // Generate code
      const config = {
        outputDir: outDir,
        force: forceOverwrite,
        filesOnly: onlyFiles,
        overrides,
        esmExtensions,
        ...(svcName._tag === "Some" ? { serviceName: svcName.value } : {}),
        ...(pkgName._tag === "Some" ? { packageName: pkgName.value } : {})
      }
      yield* generate(dataModel, config)

      yield* Console.log("\nDone!")
    })
  )
)

// ============================================================================
// Root Command
// ============================================================================

const rootCommand = Command.make("odata-effect-gen").pipe(
  Command.withSubcommands([generateCommand])
)

/**
 * CLI entry point.
 *
 * @since 1.0.0
 * @category cli
 */
export const cli = Command.run(rootCommand, {
  name: "OData Effect Generator",
  version: "0.0.1"
})

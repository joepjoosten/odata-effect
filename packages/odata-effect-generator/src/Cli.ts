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

// ============================================================================
// Generate Command
// ============================================================================

const generateCommand = Command.make(
  "generate",
  { metadataPath, outputDir, serviceName, packageName, force }
).pipe(
  Command.withDescription("Generate Effect OData client from metadata"),
  Command.withHandler((
    { force: forceOverwrite, metadataPath: metaPath, outputDir: outDir, packageName: pkgName, serviceName: svcName }
  ) =>
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem

      yield* Console.log(`Reading metadata from: ${metaPath}`)

      // Read metadata file
      const metadataContent = yield* fs.readFileString(metaPath).pipe(
        Effect.mapError((error) => new Error(`Failed to read metadata file: ${metaPath}. ${error}`))
      )

      yield* Console.log("Parsing metadata...")

      // Parse XML
      const edmx = yield* parseODataMetadata(metadataContent)

      yield* Console.log("Digesting metadata...")

      // Digest metadata
      const dataModel = yield* digestMetadata(edmx)

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

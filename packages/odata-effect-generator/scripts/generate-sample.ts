/**
 * Script to generate a sample PathBuilders file for inspection.
 * Run with: pnpm exec tsx scripts/generate-sample.ts
 */
import { Effect } from "effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { digestMetadata } from "../src/digester/Digester.js"
import { generateIndex } from "../src/generator/IndexGenerator.js"
import { generateNavigations } from "../src/generator/NavigationGenerator.js"
import { parseODataMetadata } from "../src/parser/XmlParser.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const resourceDir = path.resolve(__dirname, "../test/resource")
const xmlContent = fs.readFileSync(path.join(resourceDir, "trippin.xml"), "utf-8")

Effect.runPromise(
  Effect.gen(function*() {
    const edmx = yield* parseODataMetadata(xmlContent)
    const dataModel = yield* digestMetadata(edmx)
    const result = generateNavigations(dataModel)

    for (const file of result.navigationFiles) {
      console.log(`\n=== ${file.fileName} ===\n`)
      console.log(file.content)
    }

    console.log(`\n=== index.ts (excerpt) ===\n`)
    const indexContent = generateIndex(dataModel)
    // Print just the path builders section
    const lines = indexContent.split("\n")
    const pathBuildersStart = lines.findIndex((l) => l.includes("Path Builders"))
    if (pathBuildersStart >= 0) {
      console.log(lines.slice(pathBuildersStart, pathBuildersStart + 3).join("\n"))
    }
  })
).catch(console.error)

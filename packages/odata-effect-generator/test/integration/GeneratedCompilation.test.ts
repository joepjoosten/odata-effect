import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateIndex } from "../../src/generator/IndexGenerator.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateNavigations } from "../../src/generator/NavigationGenerator.js"
import { generateOperations } from "../../src/generator/OperationsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import { generateServiceFns } from "../../src/generator/ServiceFnGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

for (const sample of ["odata-v2", "trippin"]) {
  it.effect(`compiles generated ${sample} models and services against the installed runtime`, () =>
    Effect.gen(function*() {
      const xml = fs.readFileSync(path.resolve(__dirname, `../resource/${sample}.xml`), "utf8")
      const model = yield* parseODataMetadata(xml).pipe(Effect.flatMap(digestMetadata))
      const options = { esmExtensions: true }
      const files: Record<string, string> = {
        "Models.ts": generateModels(model),
        "index.ts": generateIndex(model, options),
        "PathBuilders.ts": generateNavigations(model, options).navigationFiles[0].content,
        "QueryModels.ts": generateQueryModels(model, options),
        "Services.ts": generateServiceFns(model, options).servicesFile.content,
        "Operations.ts": generateOperations(model, options).operationsFile!.content
      }
      if (sample === "trippin") {
        files["Consumer.ts"] = `
import { People, byKey, trips, fetchOne, fetchCollection } from "./PathBuilders.js"
import { Person, Trip } from "./Models.js"
import { pipe } from "effect/Function"
export const valid = fetchCollection(Trip)(trips(byKey("alice")(People)))
export const piped = pipe(People, byKey("alice"), trips, fetchCollection(Trip))
// @ts-expect-error Navigation requires a single person, not a collection.
trips(People)
// @ts-expect-error A collection path cannot be fetched as a single entity.
fetchOne(Person)(People)
// @ts-expect-error A single-entity path cannot be fetched as a collection.
fetchCollection(Person)(byKey("alice")(People))
`
      }
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), "odata-compilation-"))
      try {
        fs.writeFileSync(path.join(directory, "package.json"), "{\"type\":\"module\"}")
        const root = path.resolve(__dirname, "../../../..")
        fs.symlinkSync(path.join(root, "node_modules"), path.join(directory, "node_modules"), "dir")
        const fileNames = Object.entries(files).map(([name, content]) => {
          const fileName = path.join(directory, name)
          fs.writeFileSync(fileName, content)
          return fileName
        })
        const config = ts.readConfigFile(path.join(root, "tsconfig.base.json"), ts.sys.readFile)
        const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
        const program = ts.createProgram(fileNames, {
          ...parsed.options,
          composite: false,
          incremental: false,
          noEmit: true,
          declaration: false,
          declarationMap: false
        })
        const diagnostics = ts.getPreEmitDiagnostics(program)
        expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))).toEqual([])
      } finally {
        fs.rmSync(directory, { recursive: true, force: true })
      }
    }))
}

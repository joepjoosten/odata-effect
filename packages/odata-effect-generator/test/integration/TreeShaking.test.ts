import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import { build } from "esbuild"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateIndex } from "../../src/generator/IndexGenerator.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateNavigations } from "../../src/generator/NavigationGenerator.js"
import { generateOperations } from "../../src/generator/OperationsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import { generateServiceFns } from "../../src/generator/ServiceFnGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

it.live("removes unrelated generated services and paths through direct and barrel imports", () =>
  Effect.gen(function*() {
    const xml = fs.readFileSync(path.resolve(__dirname, "../resource/trippin.xml"), "utf8")
    const model = yield* parseODataMetadata(xml).pipe(Effect.flatMap(digestMetadata))
    const options = { esmExtensions: true }
    const files = {
      "Models.ts": generateModels(model),
      "Services.ts": generateServiceFns(model, options).servicesFile.content,
      "QueryModels.ts": generateQueryModels(model, options),
      "Operations.ts": generateOperations(model, options).operationsFile!.content,
      "PathBuilders.ts": generateNavigations(model, options).navigationFiles[0].content,
      "index.ts": generateIndex(model, options)
    }
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "odata-bundle-"))
    try {
      for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(directory, name), content)
      for (
        const [symbol, module] of [["getAllAirline", "Services"], ["AirlineService", "Services"], [
          "airlineQuery",
          "QueryModels"
        ]]
      ) {
        for (const from of [module, "index"]) {
          const result = yield* Effect.promise(() =>
            build({
              stdin: {
                contents: `import { ${symbol} } from "./${from}.ts"; console.log(${symbol});`,
                resolveDir: directory
              },
              bundle: true,
              write: false,
              format: "esm",
              treeShaking: true,
              minify: true,
              // Keep runtime calls opaque: unannotated generated initializers cannot be optimized away.
              external: ["effect/*", "@odata-effect/*"]
            })
          )
          const text = result.outputFiles[0].text
          expect(text).not.toContain("FlightNumber")
          expect(text).not.toContain("UserName")
          expect(text).not.toContain("Airports")
          expect(text).toContain("AirlineCode")
          if (symbol === "getAllAirline") {
            expect(text).not.toContain("crud(")
            expect(text).not.toContain(".patch(")
            expect(text).not.toContain(".post(")
          }
        }
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }))

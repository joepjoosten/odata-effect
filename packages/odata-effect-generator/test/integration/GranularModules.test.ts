import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import { rollup } from "rollup"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateSourceFiles } from "../../src/generator/SourceFilesGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"
import { granularMetadata } from "../resource/granular.js"

const fixture = () =>
  parseODataMetadata(granularMetadata()).pipe(Effect.flatMap((metadata) =>
    digestMetadata(metadata, {
      entities: { Target: { name: "Result" } },
      complexTypes: { Detail: { name: "Info" } },
      operations: { Find: { name: "lookup", parameters: { Search: "term" } } },
      properties: { ID: "id" }
    })
  ))

it.effect("emits deterministic narrow modules, documented names and extension-compatible facades", () =>
  Effect.gen(function*() {
    const model = yield* fixture()
    for (const esmExtensions of [true, false]) {
      const files = generateSourceFiles(model, { esmExtensions })
      const sources = Object.fromEntries(files.map((file) => [file.fileName, file.content]))
      expect(sources["Models.ts"]).not.toContain("Schema.Struct")
      expect(sources["Models.Result.ts"]).toContain("import { Info }")
      expect(sources["Models.Result.ts"]).not.toContain("Unrelated")
      expect(sources["Operations.lookup.ts"]).toContain("from \"./Models.Result" + (esmExtensions ? ".js\"" : "\""))
      expect(sources["Operations.lookup.ts"]).not.toContain("Unrelated")
      expect(sources["Operations.findMood.ts"]).toContain("import { Mood }")
      expect(sources["Services.Targets.ts"]).not.toContain("Unrelated")
      expect(sources["PathBuilders.ts"]).toContain("import type {")
      expect(sources["QueryModels.ts"]).toContain("import type {")
      expect(sources["index.ts"]).toContain("export * as Operations")
      expect({
        models: sources["Models.Result.ts"],
        operation: sources["Operations.lookup.ts"],
        facade: sources["Operations.ts"]
      }).toMatchSnapshot()
      const reversed = { ...model, entityTypes: new Map([...model.entityTypes].reverse()) }
      expect(generateSourceFiles(reversed, { esmExtensions }).filter((f) => f.fileName.startsWith("Models.")))
        .toEqual(files.filter((f) => f.fileName.startsWith("Models.")))
    }
  }))

it.effect("typechecks recursive models, editable inputs and compatibility imports", () =>
  Effect.gen(function*() {
    const model = yield* fixture()
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "odata-granular-types-"))
    try {
      const files = generateSourceFiles(model, { esmExtensions: true })
      files.push({
        fileName: "Consumer.ts",
        content: `
import { Result, EditableResult, Operations, TargetService, Targets } from "./index.js"
import { lookup } from "./Operations.lookup.js"
import { TargetService as DirectService } from "./Services.Targets.js"
export const values = [Result, EditableResult, Operations.lookup, lookup, TargetService, DirectService, Targets]
`
      })
      fs.writeFileSync(path.join(directory, "package.json"), "{\"type\":\"module\"}")
      const root = path.resolve(__dirname, "../../../..")
      fs.symlinkSync(path.join(root, "node_modules"), path.join(directory, "node_modules"), "dir")
      for (const file of files) fs.writeFileSync(path.join(directory, file.fileName), file.content)
      const config = ts.readConfigFile(path.join(root, "tsconfig.base.json"), ts.sys.readFile)
      const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
      const program = ts.createProgram(files.map((f) => path.join(directory, f.fileName)), {
        ...parsed.options,
        composite: false,
        incremental: false,
        noEmit: true,
        declaration: false,
        declarationMap: false
      })
      expect(ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")))
        .toEqual([])
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }))

it.effect("decodes self references and mutual structural cycles in native ESM modules", () =>
  Effect.gen(function*() {
    const model = yield* fixture()
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "odata-granular-runtime-"))
    try {
      fs.writeFileSync(path.join(directory, "package.json"), "{\"type\":\"module\"}")
      fs.symlinkSync(path.resolve(__dirname, "../../../../node_modules"), path.join(directory, "node_modules"), "dir")
      for (
        const file of generateSourceFiles(model, { esmExtensions: true }).filter((f) => f.fileName.startsWith("Models"))
      ) {
        const js = ts.transpileModule(file.content, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
        }).outputText
        fs.writeFileSync(path.join(directory, file.fileName.replace(/\.ts$/, ".js")), js)
      }
      const models = yield* Effect.promise(() =>
        import(/* @vite-ignore */ pathToFileURL(path.join(directory, "Models.js")).href)
      )
      const direct = yield* Effect.promise(() =>
        import(/* @vite-ignore */ pathToFileURL(path.join(directory, "Models.Result.js")).href)
      )
      expect(direct.Result).toBe(models.Result)
      const payload = {
        ID: "root",
        Mood: "Happy",
        Details: [{ Label: "first", Next: { Label: "second" }, Owner: { ID: "child", Mood: "Sad", Details: [] } }],
        Peers: []
      }
      const decoded = Schema.decodeUnknownSync(models.Result)(payload)
      expect(decoded).toEqual({
        id: "root",
        mood: "Happy",
        details: [{ label: "first", next: { label: "second" }, owner: { id: "child", mood: "Sad", details: [] } }],
        peers: []
      })
      expect(Schema.decodeUnknownSync(models.EditableResult)(payload)).toEqual({
        mood: "Happy",
        details: (decoded as { details: unknown }).details
      })
      expect(Schema.decodeUnknownSync(models.PartialEditableResult)({ Mood: "Sad" })).toEqual({ mood: "Sad" })
      expect(Schema.decodeUnknownSync(models.CreateResult)(payload)).toEqual({
        id: "root",
        mood: "Happy",
        details: (decoded as { details: unknown }).details
      })
      expect(Schema.decodeUnknownExit(models.Mood)("Invalid")._tag).toBe("Failure")
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }))

it.effect("Rollup excludes unrelated schemas from operation, service, path and index imports", () =>
  Effect.gen(function*() {
    const model = yield* fixture()
    const sources = new Map(
      generateSourceFiles(model, { esmExtensions: true }).map((f) => [f.fileName.replace(/\.ts$/, ".js"), f.content])
    )
    for (
      const [symbol, module] of [
        ["Operations.lookup", "index"],
        ["lookup", "Operations.lookup"],
        ["lookup", "Operations"],
        ["TargetService", "Services.Targets"],
        ["TargetService", "Services"],
        ["TargetService", "index"],
        ["Targets", "PathBuilders"],
        ["Targets", "index"]
      ]
    ) {
      const loaded: Array<string> = []
      const bundle = yield* Effect.promise(() =>
        rollup({
          input: "entry",
          external: (id) => !id.startsWith(".") && id !== "entry" && !sources.has(id),
          plugins: [{
            name: "generated-typescript",
            resolveId: (id) => id === "entry" ? id : id.startsWith("./") ? id.slice(2) : null,
            load(id) {
              if (id === "entry") {
                return symbol === "Operations.lookup"
                  ? `import { Operations } from "./index.js"; export const selected = Operations.lookup`
                  : `export { ${symbol} } from "./${module}.js"`
              }
              const source = sources.get(id)
              if (source === undefined) return null
              loaded.push(id)
              // Direct module isolation must work even without purity comments.
              const input = module.includes(".") ? source.replaceAll("/*#__PURE__*/", "") : source
              return ts.transpileModule(input, {
                compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
              }).outputText
            }
          }]
        })
      )
      try {
        const result = yield* Effect.promise(() => bundle.generate({ format: "esm" }))
        const text = result.output[0].code
        expect(text).not.toContain("UnrelatedMarker")
        expect(text).not.toContain("Unrelated0")
        if (symbol !== "Targets") expect(text).toContain("\"Label\"")
        else expect(text).not.toContain("Schema.Struct")
        if (module.includes(".")) {
          expect(loaded.some((id) => id.includes("Unrelated") || id === "Models.js" || id === "Operations.other.js"))
            .toBe(false)
        }
      } finally {
        yield* Effect.promise(() => bundle.close())
      }
    }
  }))

it.effect("allocates distinct portable model filenames for case collisions", () =>
  Effect.gen(function*() {
    const model = yield* fixture()
    const original = model.entityTypes.get("Fixture.Target")!
    model.entityTypes.set("Fixture.Lower", { ...original, fqName: "Fixture.Lower", name: "result" })
    const files = generateSourceFiles(model, { esmExtensions: true }).filter((f) => f.fileName.startsWith("Models."))
    expect(new Set(files.map((f) => f.fileName.toLowerCase())).size).toBe(files.length)
    expect(files.some((f) => f.fileName === "Models.Result_2.ts")).toBe(true)
  }))

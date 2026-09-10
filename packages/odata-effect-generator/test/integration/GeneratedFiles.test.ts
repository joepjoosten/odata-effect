import { NodeServices } from "@effect/platform-node"
import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generate } from "../../src/generator/Generator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

it.effect("writes granular modules by default in files-only and package output", () =>
  Effect.gen(function*() {
    const model = yield* parseODataMetadata(
      `<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
<edmx:DataServices><Schema Namespace="Test" xmlns="http://docs.oasis-open.org/odata/ns/edm">
<EntityType Name="Item"><Key><PropertyRef Name="ID"/></Key><Property Name="ID" Type="Edm.String" Nullable="false"/></EntityType>
<Function Name="Find"><ReturnType Type="Test.Item"/></Function>
<EntityContainer Name="ItemsService"><EntitySet Name="Items" EntityType="Test.Item"/></EntityContainer>
</Schema></edmx:DataServices></edmx:Edmx>`
    ).pipe(Effect.flatMap(digestMetadata))
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "odata-generated-files-"))
    try {
      for (const filesOnly of [true, false]) {
        const outputDir = path.join(directory, filesOnly ? "files" : "package")
        yield* generate(model, { outputDir, filesOnly }).pipe(Effect.provide(NodeServices.layer))
        const sourceDir = filesOnly ? outputDir : path.join(outputDir, "src")
        const ext = filesOnly ? "" : ".js"
        expect(fs.readFileSync(path.join(sourceDir, "Models.ts"), "utf8"))
          .toBe(`export * from "./Models.Item${ext}"\n`)
        expect(fs.readFileSync(path.join(sourceDir, "Operations.find.ts"), "utf8"))
          .toContain(`from "./Models.Item${ext}"`)
        expect(fs.readFileSync(path.join(sourceDir, "Services.Items.ts"), "utf8"))
          .toContain(`from "./Models.Item${ext}"`)
        if (!filesOnly) {
          const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, "package.json"), "utf8"))
          expect(manifest.sideEffects).toBe(false)
          expect(manifest.exports["./*"].import).toBe("./dist/*.js")
        }
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  }))

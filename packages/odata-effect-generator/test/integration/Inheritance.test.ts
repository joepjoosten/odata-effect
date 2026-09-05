import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { generateQueryModels } from "../../src/generator/QueryModelsGenerator.js"
import { generateServiceFns } from "../../src/generator/ServiceFnGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

const metadata = (base = "Test.Middle") => `
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
<edmx:DataServices><Schema Namespace="Test" xmlns="http://docs.oasis-open.org/odata/ns/edm">
<EntityType Name="Child" BaseType="${base}"><Property Name="Extra" Type="Edm.String" Nullable="false"/></EntityType>
<EntityType Name="Middle" BaseType="Test.Base"><Property Name="Label" Type="Edm.String" Nullable="false"/></EntityType>
<EntityType Name="Base"><Key><PropertyRef Name="ID"/></Key><Property Name="ID" Type="Edm.String" Nullable="false"/>
<NavigationProperty Name="Parent" Type="Test.Base"/></EntityType>
<EntityContainer Name="Service"><EntitySet Name="Children" EntityType="Test.Child"/></EntityContainer>
</Schema></edmx:DataServices></edmx:Edmx>`

it.effect("inherits renamed fields, navigation and keys through multiple levels", () =>
  Effect.gen(function*() {
    const parsed = yield* parseODataMetadata(metadata())
    const model = yield* digestMetadata(parsed, { entities: { Base: { name: "Root", properties: { ID: "id" } } } })
    const child = model.entityTypes.get("Test.Child")!
    expect(child.keys.map((p) => p.name)).toEqual(["id"])
    expect(child.navigationProperties[0].targetType).toBe("Root")
    const output = ts.transpileModule(generateModels(model), {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText
    const exports: Record<string, Schema.Codec<unknown>> = {}
    new Function("require", "exports", output)(() => Schema, exports)
    expect(Schema.decodeUnknownSync(exports.Child)({ ID: "1", Label: "label", Extra: "extra" })).toEqual({
      id: "1",
      label: "label",
      extra: "extra"
    })
    expect(Schema.decodeUnknownExit(exports.Child)({ Extra: "extra" })._tag).toBe("Failure")
    expect(generateQueryModels(model, { esmExtensions: true })).toContain("id: new StringPath(\"ID\")")
    expect(generateServiceFns(model, { esmExtensions: true }).servicesFile.content).toContain("id.id")
  }))

for (const base of ["Test.Child", "Test.Missing"]) {
  it.effect(`rejects invalid inheritance ${base}`, () =>
    Effect.gen(function*() {
      const parsed = yield* parseODataMetadata(metadata(base))
      const result = yield* Effect.result(digestMetadata(parsed))
      expect(result._tag).toBe("Failure")
    }))
}

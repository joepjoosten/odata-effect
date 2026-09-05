import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

it.effect("create schemas retain writable keys and omit computed fields", () =>
  Effect.gen(function*() {
    const model = yield* parseODataMetadata(
      `<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
<edmx:DataServices><Schema Namespace="Test" xmlns="http://docs.oasis-open.org/odata/ns/edm">
<EntityType Name="Record"><Key><PropertyRef Name="Code"/><PropertyRef Name="Tenant"/></Key>
<Property Name="Code" Type="Edm.String" Nullable="false"/><Property Name="Tenant" Type="Edm.String" Nullable="false"/>
<Property Name="Value" Type="Edm.String" Nullable="false"/>
<Property Name="Computed" Type="Edm.String"><Annotation Term="Core.Computed" Bool="true"/></Property></EntityType>
<EntityType Name="Automatic"><Key><PropertyRef Name="Code"/></Key>
<Property Name="Code" Type="Edm.String" Nullable="false"><Annotation Term="Org.OData.Core.V1.Computed"><Bool>true</Bool></Annotation></Property>
<Property Name="Value" Type="Edm.String" Nullable="false"/></EntityType>
</Schema></edmx:DataServices></edmx:Edmx>`
    ).pipe(Effect.flatMap(digestMetadata))
    const output =
      ts.transpileModule(generateModels(model), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    const exports: Record<string, Schema.Codec<Record<string, unknown>>> = {}
    new Function("require", "exports", output)(() => Schema, exports)
    const input = { code: "key", tenant: "tenant", value: "value", computed: "ignored" }
    expect(Schema.encodeSync(exports.CreateRecord)(input)).toEqual({ Code: "key", Tenant: "tenant", Value: "value" })
    expect(Schema.encodeSync(exports.EditableRecord)(input)).toEqual({ Value: "value" })
    expect(Schema.encodeSync(exports.CreateAutomatic)({ value: "value" })).toEqual({ Value: "value" })
    expect(Schema.decodeUnknownExit(exports.CreateRecord)({ Value: "value" })._tag).toBe("Failure")
  }))

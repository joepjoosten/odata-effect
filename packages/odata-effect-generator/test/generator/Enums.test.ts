import { expect, it } from "@effect/vitest"
import * as Schema from "effect/Schema"
import ts from "typescript"
import { generateModels } from "../../src/generator/ModelsGenerator.js"
import { createDataModel } from "../../src/model/DataModel.js"

it("generated enum schemas decode every member and reject unknown values", () => {
  const model = createDataModel("V4", "Test", "Test")
  model.enumTypes.set("Test.Color", {
    fqName: "Test.Color",
    name: "Color",
    odataName: "Color",
    isFlags: false,
    members: ["Red", "Green", "Blue"].map((name, value) => ({ name, value }))
  })
  const output = ts.transpileModule(generateModels(model), {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText
  const exports: Record<string, Schema.Codec<string>> = {}
  new Function("require", "exports", output)(() => Schema, exports)
  for (const value of ["Red", "Green", "Blue"]) {
    expect(Schema.decodeUnknownSync(exports.Color)(value)).toBe(value)
    expect(Schema.encodeSync(exports.Color)(value)).toBe(value)
  }
  expect(Schema.decodeUnknownExit(exports.Color)("Purple")._tag).toBe("Failure")
})

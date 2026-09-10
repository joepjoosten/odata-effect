import { expect, it } from "@effect/vitest"
import * as Runtime from "@odata-effect/odata-effect"
import * as Operations from "@odata-effect/odata-effect/Operations"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SchemaGetter from "effect/SchemaGetter"
import * as Http from "effect/unstable/http"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateSourceFiles } from "../../src/generator/SourceFilesGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"
import { granularMetadata } from "../resource/granular.js"

it.effect("preserves generated operation parameters, collection decoding and errors", () =>
  Effect.gen(function*() {
    const model = yield* parseODataMetadata(granularMetadata()).pipe(Effect.flatMap((metadata) =>
      digestMetadata(metadata, {
        operations: { Find: { name: "lookup", parameters: { Search: "term" } } }
      })
    ))
    const sources = new Map(
      generateSourceFiles(model, { esmExtensions: true }).map((file) => [
        `./${file.fileName.replace(/\.ts$/, ".js")}`,
        ts.transpileModule(file.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
      ])
    )
    const cache = new Map<string, Record<string, unknown>>()
    const load = (id: string): Record<string, unknown> => {
      if (id === "effect/Schema") {
        return Schema
      }
      if (id === "effect/Effect") {
        return Effect
      }
      if (id === "effect/unstable/http") {
        return Http
      }
      if (id === "@odata-effect/odata-effect/Operations") {
        return Operations
      }
      if (id === "@odata-effect/odata-effect/ODataV4") {
        return Runtime.ODataV4
      }
      const cached = cache.get(id)
      if (cached) {
        return cached
      }
      const source = sources.get(id)
      if (!source) {
        throw new Error(`Unexpected import ${id}`)
      }
      const exports = {}
      cache.set(id, exports)
      new Function("require", "exports", source)(load, exports)
      return exports
    }
    const direct = load("./Operations.lookup.js")
    const facade = load("./Operations.js")
    expect(direct.lookup).toBe(facade.lookup)
    expect([...cache.keys()].some((id) =>
      id.includes("Unrelated")
    )).toBe(true) // the entire facade was evaluated
    const lookup = direct.lookup as (
      params: { term: string }
    ) => Effect.Effect<unknown, unknown, Runtime.ODataV4.ODataV4ClientDependencies>
    let invalid = false
    const client = Http.HttpClient.make((request) => {
      expect(request.method).toBe("GET")
      expect(request.url).toBe("https://example.com/odata/Find(Search='hello%20world')")
      return Effect.succeed(Http.HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify({
          value: [{ ID: "target", Mood: invalid ? "Invalid" : "Happy", Details: [{ Label: "nested" }] }]
        }))
      ))
    })
    const run = () =>
      lookup({ term: "hello world" }).pipe(
        Effect.provideService(Runtime.Config.ODataClientConfig, {
          baseUrl: "https://example.com",
          servicePath: "/odata/"
        }),
        Effect.provideService(Http.HttpClient.HttpClient, client)
      )
    expect(yield* run()).toEqual([{ iD: "target", mood: "Happy", details: [{ label: "nested" }] }])
    invalid = true
    expect((yield* Effect.exit(run()))._tag).toBe("Failure")
  }))

it.effect("preserves V2 deferred links, wrapped navigation collections and editable nested schemas", () =>
  Effect.gen(function*() {
    // The digested V4 fixture already describes the same resolved navigation
    // graph used by V2 associations. Switch the wire version to exercise V2 codecs.
    const model = yield* parseODataMetadata(granularMetadata()).pipe(Effect.flatMap(digestMetadata))
    const sources = new Map(
      generateSourceFiles({ ...model, version: "V2" }, { esmExtensions: true })
        .filter((file) => file.fileName.startsWith("Models"))
        .map((file) => [
          `./${file.fileName.replace(/\.ts$/, ".js")}`,
          ts.transpileModule(file.content, {
            compilerOptions: { module: ts.ModuleKind.CommonJS }
          }).outputText
        ])
    )
    const cache = new Map<string, Record<string, Schema.Codec<unknown>>>()
    const load = (id: string): object => {
      if (id === "effect/Schema") return Schema
      if (id === "effect/SchemaGetter") return SchemaGetter
      if (id === "@odata-effect/odata-effect") return Runtime
      if (cache.has(id)) return cache.get(id)!
      const exports = {}
      cache.set(id, exports)
      const source = sources.get(id)
      if (!source) throw new Error(`Unexpected import ${id}`)
      new Function("require", "exports", source)(load, exports)
      return exports
    }
    load("./Models.Target.js")
    expect([...cache.keys()].some((id) => id.includes("Unrelated"))).toBe(false)
    const models = cache.get("./Models.Target.js")!
    const child = { ID: "child", Mood: "Sad", Details: [] }
    const payload = {
      ID: "root",
      Mood: "Happy",
      Details: [{ Label: "nested", Owner: child }],
      Peers: { results: [child] }
    }
    const decoded = Schema.decodeUnknownSync(models.Target)(payload)
    expect(decoded).toMatchObject({
      iD: "root",
      details: [{ label: "nested", owner: { iD: "child" } }],
      peers: [{ iD: "child" }]
    })
    const deferred = { __deferred: { uri: "https://example.com/Targets" } }
    expect(Schema.decodeUnknownSync(models.Target)({ ...payload, Peers: deferred })).toMatchObject({ peers: deferred })
    expect(Schema.decodeUnknownSync(models.EditableTarget)(payload)).toMatchObject({ details: [{ label: "nested" }] })
  }))

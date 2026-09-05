import { expect, it } from "@effect/vitest"
import { Config, ODataV4 } from "@odata-effect/odata-effect"
import * as PromiseRuntime from "@odata-effect/odata-effect-promise"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import * as fs from "node:fs"
import * as path from "node:path"
import ts from "typescript"
import { digestMetadata } from "../../src/digester/Digester.js"
import { generateNavigations } from "../../src/generator/NavigationGenerator.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

it.effect("executes generated navigation, escaped keys, derived casts and query option precedence", () =>
  Effect.gen(function*() {
    const xml = fs.readFileSync(path.resolve(__dirname, "../resource/trippin.xml"), "utf8")
    const model = yield* parseODataMetadata(xml).pipe(Effect.flatMap(digestMetadata))
    const generated = generateNavigations(model, { esmExtensions: true }).navigationFiles[0].content
    // Execute a consumer of the generated module against the real OData runtime.
    // Generated TypeScript contracts are checked separately by GeneratedCompilation.
    const consumer = `
import * as TestSchema from "effect/Schema"
const resultSchema = TestSchema.Struct({ id: TestSchema.Number }).pipe(TestSchema.encodeKeys({ id: "ID" }))
const flightPath = asFlight(planItems(byKey(0)(trips(byKey("O'Brien/#")(People)))))
const options = { $top: 10, $filter: "ID gt 0" }
const input = withQueryOptions(options)(flightPath)
export const collection = fetchCollection(resultSchema, { $top: 5, $orderby: "ID desc" })(input, { $top: 1 })
export const single = fetchOne(resultSchema)(byKey(7)(flightPath))
export const originalOptions = options
`
    const output = ts.transpileModule(generated + consumer, {
      compilerOptions: { module: ts.ModuleKind.CommonJS }
    }).outputText
    const exports: {
      collection?: Effect.Effect<unknown, unknown, ODataV4.ODataV4ClientDependencies>
      single?: Effect.Effect<unknown, unknown, ODataV4.ODataV4ClientDependencies>
      originalOptions?: unknown
    } = {}
    new Function("require", "exports", output)((name: string) => {
      if (name === "@odata-effect/odata-effect") return { ODataV4 }
      if (name === "@odata-effect/odata-effect-promise") return PromiseRuntime
      if (name === "effect/Schema") return Schema
      throw new Error(`Unexpected generated import: ${name}`)
    }, exports)
    const urls: Array<string> = []
    const client = HttpClient.make((request) => {
      urls.push(request.url)
      expect(request.method).toBe("GET")
      return Effect.succeed(HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(
          urls.length === 1 ? { value: [{ ID: 7 }] } : { ID: 7 }
        ))
      ))
    })
    const run = <A, E>(effect: Effect.Effect<A, E, ODataV4.ODataV4ClientDependencies>) =>
      effect.pipe(
        Effect.provideService(Config.ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
        Effect.provideService(HttpClient.HttpClient, client)
      )
    expect(yield* run(exports.collection!)).toEqual([{ id: 7 }])
    expect(yield* run(exports.single!)).toEqual({ id: 7 })
    const collectionUrl = new URL(urls[0])
    expect(collectionUrl.pathname).toBe("/odata/People('O''Brien%2F%23')/Trips(0)/PlanItems/Trippin.Flight")
    expect(Object.fromEntries(collectionUrl.searchParams)).toEqual({
      $top: "1",
      $filter: "ID gt 0",
      $orderby: "ID desc"
    })
    expect(urls[1]).toBe("https://example.com/odata/People('O''Brien%2F%23')/Trips(0)/PlanItems/Trippin.Flight(7)")
    expect(exports.originalOptions).toEqual({ $top: 10, $filter: "ID gt 0" })
  }))

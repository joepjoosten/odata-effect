import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { ODataClientConfig } from "../src/Config.js"
import * as OData from "../src/OData.js"
import * as ODataV4 from "../src/ODataV4.js"

const entity = Schema.Struct({ id: Schema.Number }).pipe(Schema.encodeKeys({ id: "ID" }))
const config = { baseUrl: "https://example.com", servicePath: "/odata/" }

for (
  const [version, api, wrap] of [
    ["V2", OData, (row: unknown) => ({ d: row })],
    ["V4", ODataV4, (row: unknown) => row]
  ] as const
) {
  for (
    const [scenario, body] of [
      ["malformed JSON", "{"],
      ["invalid entity", JSON.stringify(wrap({ ID: "not a number" }))]
    ]
  ) {
    it.effect(`${version} rejects ${scenario} with the decoding cause preserved`, () =>
      Effect.gen(function*() {
        const error = yield* api.get("Products(1)", entity).pipe(Effect.flip)
        expect(error).toMatchObject({ _tag: "ODataError", cause: { _tag: "ParseError" } })
      }).pipe(
        Effect.provideService(ODataClientConfig, config),
        Effect.provideService(
          HttpClient.HttpClient,
          HttpClient.make((request) => Effect.succeed(HttpClientResponse.fromWeb(request, new Response(body))))
        )
      ))
  }

  it.effect(`${version} rejects invalid writes before executing HTTP`, () =>
    Effect.gen(function*() {
      const positive = Schema.Struct({ quantity: Schema.Number.check(Schema.isGreaterThan(0)) })
      const error = yield* api.post("Products", { quantity: -1 }, positive, entity).pipe(Effect.flip)
      expect(error).toMatchObject({ _tag: "ODataError", cause: { _tag: "HttpBodyError" } })
    }).pipe(
      Effect.provideService(ODataClientConfig, config),
      Effect.provideService(HttpClient.HttpClient, HttpClient.make(() => Effect.die("Invalid write reached HTTP")))
    ))

  it.effect(`${version} retains status and plain-text diagnostics on failed writes`, () =>
    Effect.gen(function*() {
      const error = yield* api.post("Products", { id: 1 }, entity, entity).pipe(Effect.flip)
      expect(error).toMatchObject({ _tag: "ODataError", status: 409, responseBody: "Duplicate key" })
    }).pipe(
      Effect.provideService(ODataClientConfig, config),
      Effect.provideService(
        HttpClient.HttpClient,
        HttpClient.make((request) =>
          Effect.succeed(HttpClientResponse.fromWeb(request, new Response("Duplicate key", { status: 409 })))
        )
      )
    ))
}

import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { ODataClientConfig } from "../src/Config.js"
import { crud } from "../src/CrudV4.js"

it.effect("uses a separate create schema to encode a client-assigned key", () => {
  const full = Schema.Struct({ id: Schema.String, name: Schema.String })
  const service = crud({
    path: "Products",
    schema: full,
    editableSchema: Schema.Struct({ name: Schema.String }),
    createSchema: full,
    idToKey: (id: string) => id
  })
  return service.create({ id: "client-key", name: "name" }).pipe(
    Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        expect(request.body._tag).toBe("Uint8Array")
        if (request.body._tag === "Uint8Array") {
          expect(JSON.parse(new TextDecoder().decode(request.body.body))).toEqual({ id: "client-key", name: "name" })
        }
        return Effect.succeed(
          HttpClientResponse.fromWeb(request, new Response(JSON.stringify({ id: "client-key", name: "name" })))
        )
      })
    )
  )
})

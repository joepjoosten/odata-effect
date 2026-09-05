import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { ODataClientConfig } from "../src/Config.js"
import { crud as crudV2 } from "../src/Crud.js"
import { crud as crudV4 } from "../src/CrudV4.js"

const entity = Schema.Struct({ id: Schema.Number, name: Schema.String })
const projection = Schema.Struct({ id: Schema.Number }).pipe(Schema.encodeKeys({ id: "ID" }))
for (const [version, crud] of [["V2", crudV2], ["V4", crudV4]] as const) {
  const service = crud({ path: "Products", schema: entity, editableSchema: entity, idToKey: (id: number) => id })
  it.effect(`decodes renamed projected fields in ${version}`, () =>
    Effect.gen(function*() {
      const result = yield* service.getAllWithSchema(projection, { $select: "ID" })
      expect(result).toEqual([{ id: 1 }])
      // @ts-expect-error The projection result must not claim omitted entity fields.
      expect(result[0].name).toBeUndefined()
    }).pipe(
      Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
      Effect.provideService(
        HttpClient.HttpClient,
        HttpClient.make((request) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response(JSON.stringify(
                version === "V2" ? { d: { results: [{ ID: 1 }] } } : { value: [{ ID: 1 }] }
              ))
            )
          )
        )
      )
    ))
  it.effect(`rejects implicit projection schemas in ${version} before sending HTTP`, () =>
    Effect.gen(function*() {
      const result = yield* Effect.result(service.getAll({ $select: "ID" }))
      expect(result._tag).toBe("Failure")
      if (result._tag === "Failure") expect(result.failure._tag).toBe("ParseError")
    }).pipe(
      Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
      Effect.provideService(HttpClient.HttpClient, HttpClient.make(() => Effect.die("unexpected request")))
    ))
}

it.effect("decodes a nested single-entity projection with its explicit schema", () => {
  const service = crudV4({ path: "Products", schema: entity, editableSchema: entity, idToKey: (id: number) => id })
  const schema = Schema.Struct({ ID: Schema.Number, Children: Schema.Array(Schema.Struct({ ID: Schema.Number })) })
  return service.getByIdWithSchema(1, schema, { $select: "ID", $expand: "Children($select=ID)" }).pipe(
    Effect.tap((result) => Effect.sync(() => expect(result).toEqual({ ID: 1, Children: [{ ID: 2 }] }))),
    Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(request, new Response(JSON.stringify({ ID: 1, Children: [{ ID: 2 }] })))
        )
      )
    )
  )
})

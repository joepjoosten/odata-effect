import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { ODataClientConfig } from "../src/Config.js"
import { getCollectionPaged } from "../src/OData.js"

const nextLink = "https://example.com/odata/Products?$skiptoken=a%2Bb%3D"
const row = { ID: 1 }
const entity = Schema.Struct({ id: Schema.Number }).pipe(Schema.encodeKeys({ id: "ID" }))
for (
  const [name, body, count, next] of [
    ["V2 metadata", { d: { results: [row], __count: "23", __next: nextLink } }, 23, nextLink],
    ["V2 zero count", { d: { results: [], __count: "0" } }, 0, undefined],
    ["V2 missing metadata", { d: { results: [row] } }, undefined, undefined],
    ["legacy V2", { d: [row] }, undefined, undefined],
    ["V3 numeric count", { value: [row], "odata.count": 23, "odata.nextLink": nextLink }, 23, nextLink],
    ["V3 string count", { value: [row], "odata.count": "23" }, 23, undefined]
  ] as const
) {
  it.effect(`normalizes ${name} without losing rows or rewriting continuation tokens`, () =>
    Effect.gen(function*() {
      const page = yield* getCollectionPaged("Products", entity, { $top: 0, $skip: 0, $inlinecount: "allpages" })
      expect(page).toEqual({ results: name === "V2 zero count" ? [] : [{ id: 1 }], count, nextLink: next })
    }).pipe(
      Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
      Effect.provideService(
        HttpClient.HttpClient,
        HttpClient.make((request) => {
          const url = new URL(request.url)
          expect(url.searchParams.get("$top")).toBe("0")
          expect(url.searchParams.get("$skip")).toBe("0")
          expect(url.searchParams.get("$inlinecount")).toBe("allpages")
          return Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(body))))
        })
      )
    ))
}

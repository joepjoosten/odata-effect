import { expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { HttpClient, HttpClientResponse } from "effect/unstable/http"
import { ODataClientConfig } from "../src/Config.js"
import { buildEntityPath } from "../src/OData.js"
import { buildEntityPathV4, get } from "../src/ODataV4.js"

for (const build of [buildEntityPath, buildEntityPathV4]) {
  it(`escapes scalar and composite keys in ${build.name}`, () => {
    expect(build("People", "O'Neil")).toBe("People('O''Neil')")
    expect(build("People", "A#B?/100%☃")).toBe("People('A%23B%3F%2F100%25%E2%98%83')")
    expect(build("People", { Name: "O'Neil/", ID: 2 })).toBe("People(Name='O''Neil%2F',ID=2)")
  })
}

it.effect("preserves the complete encoded key in the outgoing request URL", () =>
  get(buildEntityPathV4("People", "A#B?/100%"), Schema.Struct({ name: Schema.String })).pipe(
    Effect.provideService(ODataClientConfig, { baseUrl: "https://example.com", servicePath: "/odata/" }),
    Effect.provideService(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        const url = new URL(request.url)
        expect(url.hash).toBe("")
        expect(url.search).toBe("")
        expect(decodeURIComponent(url.pathname)).toBe("/odata/People('A#B?/100%')")
        return Effect.succeed(HttpClientResponse.fromWeb(request, new Response("{\"name\":\"ok\"}")))
      })
    )
  ))

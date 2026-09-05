import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { Config, OData, ODataV4 } from "@odata-effect/odata-effect"
import * as Cause from "effect/Cause"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import * as HttpClient from "effect/unstable/http/HttpClient"
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse"
import { describe, expect, it } from "vitest"
import { Runtime } from "../src/index.js"

describe("ODataEffectPromise", () => {
  describe("toPromise functionality", () => {
    it("accepts supported requirements and rejects unprovided services", async () => {
      const { createODataRuntime, toPromise } = await import("../src/index.js")
      const runtime = createODataRuntime(
        { baseUrl: "https://example.com", servicePath: "/odata/" },
        NodeHttpClient.layerUndici
      )
      const converter = toPromise(runtime)
      const Database = Context.Service<{ readonly query: () => number }>("Database")

      // This callback is intentionally never executed: tsc verifies rejection of
      // a missing service, without triggering a runtime missing-service defect.
      const unsupported = () => {
        // @ts-expect-error The OData runtime does not provide Database.
        return Database.pipe(converter)
      }
      void unsupported

      try {
        expect(await Effect.succeed(42).pipe(converter)).toBe(42)
        expect(await Config.ODataClientConfig.pipe(Effect.map((config) => config.baseUrl), converter))
          .toBe("https://example.com")
        expect(await HttpClient.HttpClient.pipe(Effect.map((client) => typeof client.execute), converter))
          .toBe("function")
        expect(
          await Effect.gen(function*() {
            const config = yield* Config.ODataClientConfig
            yield* HttpClient.HttpClient
            return config.servicePath
          }).pipe(converter)
        ).toBe("/odata/")
        expect(
          await Database.pipe(
            Effect.map((database) => database.query()),
            Effect.provideService(Database, { query: () => 7 }),
            converter
          )
        ).toBe(7)
      } finally {
        await runtime.dispose()
      }
    })
  })
})

describe("Runtime boundaries", () => {
  it("executes V2 and V4 requests through the supplied client and releases its layer once", async () => {
    const requests: Array<string> = []
    let released = 0
    const client = HttpClient.make((request) => {
      requests.push(request.url)
      return Effect.succeed(HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(
          request.url.endsWith("V2") ? { d: { ID: 1 } } : { ID: 2 }
        ))
      ))
    })
    const runtime = Runtime.createODataRuntime(
      { baseUrl: "https://example.com", servicePath: "/odata/" },
      Layer.effect(
        HttpClient.HttpClient,
        Effect.acquireRelease(
          Effect.succeed(client),
          () =>
            Effect.sync(() => {
              released++
            })
        )
      )
    )
    const schema = Schema.Struct({ id: Schema.Number }).pipe(Schema.encodeKeys({ id: "ID" }))
    try {
      expect(await OData.get("V2", schema).pipe(Runtime.toPromise(runtime))).toEqual({ id: 1 })
      expect(await ODataV4.get("V4", schema).pipe(Runtime.toPromise(runtime))).toEqual({ id: 2 })
      expect(requests).toEqual(["https://example.com/odata/V2", "https://example.com/odata/V4"])
      expect(released).toBe(0)
    } finally {
      await runtime.dispose()
    }
    await runtime.dispose()
    expect(released).toBe(1)
  })

  it("rejects failed Effects and preserves their typed error in runPromiseExit", async () => {
    const runtime = Runtime.createODataRuntime(
      { baseUrl: "https://example.com", servicePath: "/odata/" },
      NodeHttpClient.layerUndici
    )
    const error = new Error("application failure")
    try {
      await expect(Effect.fail(error).pipe(Runtime.toPromise(runtime))).rejects.toBe(error)
      expect(await runtime.runPromiseExit(Effect.fail(error))).toEqual(Exit.fail(error))
    } finally {
      await runtime.dispose()
    }
  })

  it("interrupts an in-flight Effect on AbortSignal and runs its finalizer", async () => {
    const runtime = Runtime.createODataRuntime(
      { baseUrl: "https://example.com", servicePath: "/odata/" },
      NodeHttpClient.layerUndici
    )
    const controller = new AbortController()
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    let finalized = false
    const work = Effect.sync(started).pipe(
      Effect.andThen(Effect.never),
      Effect.ensuring(Effect.sync(() => {
        finalized = true
      }))
    )
    try {
      const pending = runtime.runPromiseExit(work, { signal: controller.signal })
      await ready
      controller.abort()
      const exit = await pending
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) expect(Cause.hasInterrupts(exit.cause)).toBe(true)
      expect(finalized).toBe(true)
    } finally {
      await runtime.dispose()
    }
  })
})

/**
 * Runtime management for OData Promise client.
 *
 * This module provides utilities to create a managed runtime that can execute
 * Effect-based OData operations as Promises.
 *
 * The runtime is platform-independent - you provide your own HTTP client layer
 * (Node.js, Bun, browser, etc.).
 *
 * @example Node.js
 * ```ts
 * import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
 * import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
 * import { OData, ODataV4 } from "@odata-effect/odata-effect"
 * import { pipe } from "effect"
 *
 * // Create runtime with Node.js HTTP client
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://server.com", servicePath: "/sap/opu/odata/sap/MY_SERVICE/" },
 *   NodeHttpClient.layer
 * )
 *
 * // Use with V2
 * const productV2 = await pipe(
 *   OData.get("Products('1')", ProductSchema),
 *   toPromise(runtime)
 * )
 *
 * // Use with V4 (same runtime!)
 * const productV4 = await pipe(
 *   ODataV4.get("Products(1)", ProductSchema),
 *   toPromise(runtime)
 * )
 *
 * await runtime.dispose()
 * ```
 *
 * @example Bun
 * ```ts
 * import * as BunHttpClient from "@effect/platform-bun/BunHttpClient"
 * import { createODataRuntime } from "@odata-effect/odata-effect-promise"
 *
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://server.com", servicePath: "/odata/v4/" },
 *   BunHttpClient.layer
 * )
 * ```
 *
 * @since 1.0.0
 */
import { type HttpClient } from "@effect/platform"
import { Config } from "@odata-effect/odata-effect"
import type * as Effect from "effect/Effect"
import type * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as ManagedRuntime from "effect/ManagedRuntime"

/**
 * Configuration options for creating an OData runtime.
 *
 * @since 1.0.0
 * @category config
 */
export interface ODataRuntimeConfig {
  /** The base URL of the OData service (e.g., "https://server.com") */
  readonly baseUrl: string
  /** The service path (e.g., "/sap/opu/odata/sap/MY_SERVICE/") */
  readonly servicePath: string
}

/**
 * A managed runtime for executing OData V2 and V4 operations.
 *
 * The runtime provides a unified client configuration that works with both
 * V2 and V4 operations. You only need one runtime for both OData versions.
 *
 * @since 1.0.0
 * @category runtime
 */
export interface ODataRuntime {
  /**
   * Execute an Effect that requires ODataClientConfig and/or HttpClient.
   * Returns a Promise that resolves with the result.
   */
  readonly runPromise: <A, E>(
    effect: Effect.Effect<A, E, Config.ODataClientConfig | HttpClient.HttpClient>,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<A>

  /**
   * Execute an Effect and return the Exit value.
   * Useful for handling errors without throwing.
   */
  readonly runPromiseExit: <A, E>(
    effect: Effect.Effect<A, E, Config.ODataClientConfig | HttpClient.HttpClient>,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<Exit.Exit<A, E>>

  /**
   * Dispose of the runtime and release resources.
   * Should be called when the runtime is no longer needed.
   */
  readonly dispose: () => Promise<void>

  /**
   * The underlying configuration.
   */
  readonly config: ODataRuntimeConfig
}

/**
 * Create a managed runtime for OData V2 and V4 operations.
 *
 * The runtime is platform-independent - you provide your own HTTP client layer.
 * This allows the library to work with Node.js, Bun, browser environments, etc.
 *
 * The runtime provides both V2 and V4 client configuration, so you can use
 * it with either OData version without creating separate runtimes.
 *
 * @example Node.js
 * ```ts
 * import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
 *
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://server.com", servicePath: "/sap/opu/odata/sap/MY_SERVICE/" },
 *   NodeHttpClient.layer
 * )
 *
 * try {
 *   // Use with V2
 *   const product = await runtime.runPromise(
 *     OData.get("Products('1')", ProductSchema)
 *   )
 *
 *   // Use with V4 (same runtime!)
 *   const productV4 = await runtime.runPromise(
 *     ODataV4.get("Products(1)", ProductSchema)
 *   )
 * } finally {
 *   await runtime.dispose()
 * }
 * ```
 *
 * @example Bun
 * ```ts
 * import * as BunHttpClient from "@effect/platform-bun/BunHttpClient"
 *
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://server.com", servicePath: "/odata/v4/" },
 *   BunHttpClient.layer
 * )
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export const createODataRuntime = (
  config: ODataRuntimeConfig,
  httpClientLayer: Layer.Layer<HttpClient.HttpClient>
): ODataRuntime => {
  const configLayer = Layer.succeed(Config.ODataClientConfig, config)
  const fullLayer = Layer.merge(configLayer, httpClientLayer)
  const managedRuntime = ManagedRuntime.make(fullLayer)

  return {
    runPromise: (effect, options) => managedRuntime.runPromise(effect, options),
    runPromiseExit: (effect, options) => managedRuntime.runPromiseExit(effect, options),
    dispose: () => managedRuntime.dispose(),
    config
  }
}

// ============================================================================
// toPromise - Universal Effect to Promise converter
// ============================================================================

/**
 * Convert an Effect to a Promise using the provided runtime.
 *
 * This is a curried function designed to be used with `pipe`:
 *
 * @example
 * ```ts
 * import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
 * import { pipe } from "effect"
 * import { OData, ODataV4 } from "@odata-effect/odata-effect"
 * import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
 *
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://api.example.com", servicePath: "/odata/" },
 *   NodeHttpClient.layer
 * )
 *
 * // Use with V2 OData functions
 * const productV2 = await pipe(
 *   OData.get("Products('1')", ProductSchema),
 *   toPromise(runtime)
 * )
 *
 * // Use with V4 OData functions (same runtime!)
 * const productV4 = await pipe(
 *   ODataV4.get("Products(1)", ProductSchema),
 *   toPromise(runtime)
 * )
 *
 * // Use with generated services
 * const products = await pipe(
 *   ProductService.getAll(),
 *   toPromise(runtime)
 * )
 *
 * // Use with PathBuilders
 * const trips = await pipe(
 *   People,
 *   byKey("bob"),
 *   trips,
 *   fetchCollection(TripSchema),
 *   toPromise(runtime)
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const toPromise = (runtime: ODataRuntime) => <A, E>(effect: Effect.Effect<A, E, any>): Promise<A> =>
  runtime.runPromise(effect as any)

// Re-export commonly used types from the core package
export type { ODataClientConfig, ODataClientConfigService } from "@odata-effect/odata-effect/Config"
export type { ODataQueryOptions, ODataRequestOptions, PagedResult } from "@odata-effect/odata-effect/OData"
export type { ODataV4QueryOptions, ODataV4RequestOptions, PagedResultV4 } from "@odata-effect/odata-effect/ODataV4"

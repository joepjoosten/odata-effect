/**
 * Runtime management for OData Promise client.
 *
 * This module provides utilities to create a managed runtime that can execute
 * Effect-based OData operations as Promises.
 *
 * @example
 * ```ts
 * import { createODataRuntime } from "@odata-effect/odata-effect-promise"
 * import * as OData from "@odata-effect/odata-effect-promise/v2"
 *
 * const runtime = createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/odata/v2/"
 * })
 *
 * const product = await OData.get(runtime, "Products('1')", ProductSchema)
 * await runtime.dispose()
 * ```
 *
 * @since 1.0.0
 */
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Layer from "effect/Layer"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { HttpClient } from "@effect/platform"
import { NodeHttpClient } from "@effect/platform-node"
import {
  ODataClient,
  ODataV4Client
} from "@odata-effect/odata-effect"

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
 * A managed runtime for executing OData V2 operations.
 *
 * @since 1.0.0
 * @category runtime
 */
export interface ODataRuntime {
  /**
   * Execute an Effect that requires ODataClientConfig and HttpClient.
   * Returns a Promise that resolves with the result.
   */
  readonly runPromise: <A, E>(
    effect: Effect.Effect<A, E, ODataClient.ODataClientConfig | HttpClient.HttpClient>,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<A>

  /**
   * Execute an Effect and return the Exit value.
   * Useful for handling errors without throwing.
   */
  readonly runPromiseExit: <A, E>(
    effect: Effect.Effect<A, E, ODataClient.ODataClientConfig | HttpClient.HttpClient>,
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
 * A managed runtime for executing OData V4 operations.
 *
 * @since 1.0.0
 * @category runtime
 */
export interface ODataV4Runtime {
  /**
   * Execute an Effect that requires ODataV4ClientConfig and HttpClient.
   * Returns a Promise that resolves with the result.
   */
  readonly runPromise: <A, E>(
    effect: Effect.Effect<A, E, ODataV4Client.ODataV4ClientConfig | HttpClient.HttpClient>,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<A>

  /**
   * Execute an Effect and return the Exit value.
   * Useful for handling errors without throwing.
   */
  readonly runPromiseExit: <A, E>(
    effect: Effect.Effect<A, E, ODataV4Client.ODataV4ClientConfig | HttpClient.HttpClient>,
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
 * Create a managed runtime for OData V2 operations.
 *
 * The runtime manages the HTTP client and configuration, and provides
 * Promise-based execution of OData operations.
 *
 * @example
 * ```ts
 * const runtime = createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 *
 * try {
 *   const product = await runtime.runPromise(
 *     OData.get("Products('1')", ProductSchema)
 *   )
 * } finally {
 *   await runtime.dispose()
 * }
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export const createODataRuntime = (config: ODataRuntimeConfig): ODataRuntime => {
  const configLayer = Layer.succeed(ODataClient.ODataClientConfig, config)
  const fullLayer = Layer.merge(configLayer, NodeHttpClient.layer)
  const managedRuntime = ManagedRuntime.make(fullLayer)

  return {
    runPromise: (effect, options) => managedRuntime.runPromise(effect, options),
    runPromiseExit: (effect, options) => managedRuntime.runPromiseExit(effect, options),
    dispose: () => managedRuntime.dispose(),
    config
  }
}

/**
 * Create a managed runtime for OData V4 operations.
 *
 * The runtime manages the HTTP client and configuration, and provides
 * Promise-based execution of OData operations.
 *
 * @example
 * ```ts
 * const runtime = createODataV4Runtime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/odata/v4/"
 * })
 *
 * try {
 *   const product = await runtime.runPromise(
 *     ODataV4.get("Products(1)", ProductSchema)
 *   )
 * } finally {
 *   await runtime.dispose()
 * }
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export const createODataV4Runtime = (config: ODataRuntimeConfig): ODataV4Runtime => {
  const configLayer = Layer.succeed(ODataV4Client.ODataV4ClientConfig, config)
  const fullLayer = Layer.merge(configLayer, NodeHttpClient.layer)
  const managedRuntime = ManagedRuntime.make(fullLayer)

  return {
    runPromise: (effect, options) => managedRuntime.runPromise(effect, options),
    runPromiseExit: (effect, options) => managedRuntime.runPromiseExit(effect, options),
    dispose: () => managedRuntime.dispose(),
    config
  }
}

// Re-export commonly used types
export type ODataQueryOptions = ODataClient.ODataQueryOptions
export type ODataRequestOptions = ODataClient.ODataRequestOptions
export type PagedResult<A> = ODataClient.PagedResult<A>
export type ODataV4QueryOptions = ODataV4Client.ODataV4QueryOptions
export type ODataV4RequestOptions = ODataV4Client.ODataV4RequestOptions
export type PagedResultV4<A> = ODataV4Client.PagedResultV4<A>

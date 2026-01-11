/**
 * Promise-based OData client using Effect runtime.
 *
 * This package provides a simple way to use the Effect-based OData client
 * in Promise-based codebases. Use `toPromise(runtime)` to convert any
 * Effect-based OData operation to a Promise.
 *
 * The library is platform-independent - you bring your own HTTP client layer
 * (Node.js, Bun, browser, etc.).
 *
 * @example Node.js
 * ```ts
 * import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
 * import { pipe } from "effect"
 * import { OData, ODataV4 } from "@odata-effect/odata-effect"
 * import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
 *
 * // Create runtime with Node.js HTTP client
 * const runtime = createODataRuntime(
 *   { baseUrl: "https://server.com", servicePath: "/sap/opu/odata/sap/MY_SERVICE/" },
 *   NodeHttpClient.layer
 * )
 *
 * // Use with V2 OData functions
 * const product = await pipe(
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

/**
 * Runtime management for OData Promise client.
 *
 * @since 1.0.0
 */
export * as Runtime from "./Runtime.js"

// Direct exports for convenience
export {
  createODataRuntime,
  type ODataRuntime,
  type ODataRuntimeConfig,
  toPromise
} from "./Runtime.js"

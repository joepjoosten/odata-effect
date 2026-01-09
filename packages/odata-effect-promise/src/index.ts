/**
 * Promise-based OData client using Effect runtime.
 *
 * This package provides a simple way to use the Effect-based OData client
 * in Promise-based codebases. Use `toPromise(runtime)` to convert any
 * Effect-based OData operation to a Promise.
 *
 * @example
 * ```ts
 * import { pipe } from "effect"
 * import { OData } from "@odata-effect/odata-effect"
 * import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
 *
 * const runtime = createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 *
 * // Use with OData functions
 * const product = await pipe(
 *   OData.get("Products('1')", ProductSchema),
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
 *
 * await runtime.dispose()
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
  createODataV4Runtime,
  type ODataRuntime,
  type ODataRuntimeConfig,
  type ODataV4Runtime,
  toPromise
} from "./Runtime.js"

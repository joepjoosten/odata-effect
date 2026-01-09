/**
 * Tree-shakable OData V2 Promise functions.
 *
 * This module provides Promise-based functions for OData V2 operations.
 * Import only the functions you need for maximum tree-shaking.
 *
 * @example
 * ```ts
 * import { createODataRuntime } from "@odata-effect/odata-effect-promise"
 * import * as OData from "@odata-effect/odata-effect-promise/OData"
 *
 * const runtime = createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 *
 * // Namespace import - nice autocomplete
 * const product = await OData.get(runtime, "Products('1')", ProductSchema)
 *
 * // Or create bound functions
 * const boundGet = OData.get.bind(null, runtime)
 * const product2 = await boundGet("Products('2')", ProductSchema)
 *
 * await runtime.dispose()
 * ```
 *
 * @since 1.0.0
 */
export * as OData from "./OData.js"

/**
 * Tree-shakable OData V4 Promise functions.
 *
 * This module provides Promise-based functions for OData V4 operations.
 * Import only the functions you need for maximum tree-shaking.
 *
 * @example
 * ```ts
 * import { createODataV4Runtime } from "@odata-effect/odata-effect-promise"
 * import * as ODataV4 from "@odata-effect/odata-effect-promise/ODataV4"
 *
 * const runtime = createODataV4Runtime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/odata/v4/"
 * })
 *
 * // Namespace import - nice autocomplete
 * const product = await ODataV4.get(runtime, "Products(1)", ProductSchema)
 *
 * // Or create bound functions
 * const boundGet = (path, schema, opts) => ODataV4.get(runtime, path, schema, opts)
 * const product2 = await boundGet("Products(2)", ProductSchema)
 *
 * await runtime.dispose()
 * ```
 *
 * @since 1.0.0
 */
export * as ODataV4 from "./ODataV4.js"

/**
 * Runtime management for OData Promise client.
 *
 * This module provides utilities to create a managed runtime that can execute
 * Effect-based OData operations as Promises.
 *
 * @example
 * ```ts
 * import { Runtime } from "@odata-effect/odata-effect-promise"
 * import * as OData from "@odata-effect/odata-effect-promise/OData"
 *
 * const runtime = Runtime.createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 *
 * const product = await OData.get(runtime, "Products('1')", ProductSchema)
 * await runtime.dispose()
 * ```
 *
 * @since 1.0.0
 */
export * as Runtime from "./Runtime.js"

// Direct exports for convenience
export {
  createODataRuntime,
  createODataV4Runtime,
  toPromise,
  type ODataRuntime,
  type ODataV4Runtime,
  type ODataRuntimeConfig
} from "./Runtime.js"

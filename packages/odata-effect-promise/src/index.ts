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
export * as Runtime from "./Runtime.js"

/**
 * Tree-shakable OData V2 Promise functions.
 *
 * This module provides Promise-based functions for OData V2 operations.
 * Import only the functions you need for maximum tree-shaking.
 *
 * @example
 * ```ts
 * import { createODataRuntime } from "@odata-effect/odata-effect-promise"
 * import * as OData from "@odata-effect/odata-effect-promise/v2"
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
export * as v2 from "./v2.js"

/**
 * Tree-shakable OData V4 Promise functions.
 *
 * This module provides Promise-based functions for OData V4 operations.
 * Import only the functions you need for maximum tree-shaking.
 *
 * @example
 * ```ts
 * import { createODataV4Runtime } from "@odata-effect/odata-effect-promise"
 * import * as ODataV4 from "@odata-effect/odata-effect-promise/v4"
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
export * as v4 from "./v4.js"

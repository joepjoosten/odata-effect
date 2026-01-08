/**
 * Promise-based OData client for non-Effect environments.
 *
 * This package provides Promise-based wrappers for the Effect-based OData client,
 * allowing you to use OData operations in non-Effect codebases.
 *
 * ## Usage: Runtime + Functions (Tree-shakable)
 *
 * For maximum tree-shaking, use the runtime with tree-shakable functions:
 *
 * ```ts
 * import { createODataRuntime, createODataV4Runtime } from "@odata-effect/odata-effect-promise"
 * import * as OData from "@odata-effect/odata-effect-promise/v2"
 * import * as ODataV4 from "@odata-effect/odata-effect-promise/v4"
 *
 * // OData V2
 * const runtime = createODataRuntime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 *
 * const product = await OData.get(runtime, "Products('1')", ProductSchema)
 * await runtime.dispose()
 *
 * // OData V4
 * const v4runtime = createODataV4Runtime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/odata/v4/"
 * })
 *
 * const product = await ODataV4.get(v4runtime, "Products(1)", ProductSchema)
 * await v4runtime.dispose()
 * ```
 *
 * ## Error Handling
 *
 * Errors are thrown as JavaScript errors. Use try/catch to handle them:
 *
 * ```ts
 * try {
 *   const product = await OData.get(runtime, "Products('999')", ProductSchema)
 * } catch (error) {
 *   console.error("Failed to fetch product:", error)
 * }
 * ```
 *
 * For structured error handling, use `runPromiseExit` on the runtime:
 *
 * ```ts
 * import { Exit } from "effect"
 *
 * const exit = await runtime.runPromiseExit(OData.get(runtime, "Products('1')", ProductSchema))
 *
 * if (Exit.isSuccess(exit)) {
 *   console.log("Product:", exit.value)
 * } else {
 *   console.error("Failed:", exit.cause)
 * }
 * ```
 *
 * ## Lifecycle Management
 *
 * Always dispose of the runtime when you're done to release resources:
 *
 * ```ts
 * const runtime = createODataRuntime({ ... })
 *
 * try {
 *   // ... use runtime
 * } finally {
 *   await runtime.dispose()
 * }
 * ```
 *
 * @since 1.0.0
 */

// Runtime exports
export {
  createODataRuntime,
  createODataV4Runtime,
  type ODataRuntime,
  type ODataV4Runtime,
  type ODataRuntimeConfig,
  type ODataQueryOptions,
  type ODataRequestOptions,
  type PagedResult,
  type ODataV4QueryOptions,
  type ODataV4RequestOptions,
  type PagedResultV4
} from "./Runtime.js"

// V2 namespace export
import * as v2Exports from "./v2.js"
export { v2Exports as OData }

// V4 namespace export
import * as v4Exports from "./v4.js"
export { v4Exports as ODataV4 }

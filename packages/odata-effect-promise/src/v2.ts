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
import { ODataClientFn as ODataFn } from "@odata-effect/odata-effect"
import type * as Schema from "effect/Schema"
import type { ODataQueryOptions, ODataRequestOptions, ODataRuntime, PagedResult } from "./Runtime.js"

/**
 * Fetch a single entity by path.
 *
 * @example
 * ```ts
 * const product = await get(runtime, "Products('123')", ProductSchema)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const get = <A, I>(
  runtime: ODataRuntime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataQueryOptions
): Promise<A> => runtime.runPromise(ODataFn.get(path, schema, options))

/**
 * Fetch a collection of entities.
 *
 * @example
 * ```ts
 * const products = await getCollection(runtime, "Products", ProductSchema, {
 *   $filter: "Price gt 100",
 *   $orderby: "Name"
 * })
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollection = <A, I>(
  runtime: ODataRuntime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataQueryOptions
): Promise<ReadonlyArray<A>> => runtime.runPromise(ODataFn.getCollection(path, schema, options))

/**
 * Fetch a collection with pagination metadata.
 *
 * @example
 * ```ts
 * const result = await getCollectionPaged(runtime, "Products", ProductSchema, {
 *   $inlinecount: "allpages",
 *   $top: 10
 * })
 * console.log(result.results, result.count, result.nextLink)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollectionPaged = <A, I>(
  runtime: ODataRuntime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataQueryOptions
): Promise<PagedResult<A>> => runtime.runPromise(ODataFn.getCollectionPaged(path, schema, options))

/**
 * Fetch a single property value.
 *
 * @example
 * ```ts
 * const name = await getValue(runtime, "Products('1')/Name", "Name", Schema.String)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getValue = <A, I>(
  runtime: ODataRuntime,
  path: string,
  propertyName: string,
  schema: Schema.Schema<A, I, never>
): Promise<A> => runtime.runPromise(ODataFn.getValue(path, propertyName, schema))

/**
 * Fetch a complex property.
 *
 * @example
 * ```ts
 * const address = await getComplex(runtime, "Customers('1')/Address", AddressSchema)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getComplex = <A, I>(
  runtime: ODataRuntime,
  path: string,
  schema: Schema.Schema<A, I, never>
): Promise<A> => runtime.runPromise(ODataFn.getComplex(path, schema))

/**
 * Expand a deferred navigation property.
 *
 * @example
 * ```ts
 * // When you have a deferred property from a V2 response
 * const product = await get(runtime, "Orders('1')", OrderSchema)
 * if ('__deferred' in product.Product) {
 *   const fullProduct = await expandDeferred(runtime, product.Product, ProductSchema)
 * }
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const expandDeferred = <A, I>(
  runtime: ODataRuntime,
  deferred: { readonly __deferred: { readonly uri: string } },
  schema: Schema.Schema<A, I, never>
): Promise<A> => runtime.runPromise(ODataFn.expandDeferred(deferred, schema))

/**
 * Expand a deferred navigation property that returns a collection.
 *
 * @example
 * ```ts
 * const customer = await get(runtime, "Customers('1')", CustomerSchema)
 * if ('__deferred' in customer.Orders) {
 *   const orders = await expandDeferredCollection(runtime, customer.Orders, OrderSchema)
 * }
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const expandDeferredCollection = <A, I>(
  runtime: ODataRuntime,
  deferred: { readonly __deferred: { readonly uri: string } },
  schema: Schema.Schema<A, I, never>
): Promise<ReadonlyArray<A>> => runtime.runPromise(ODataFn.expandDeferredCollection(deferred, schema))

/**
 * Create a new entity.
 *
 * @example
 * ```ts
 * const newProduct = await post(
 *   runtime,
 *   "Products",
 *   { Name: "Widget", Price: 10 },
 *   CreateProductSchema,
 *   ProductSchema
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const post = <A, I, B, BI>(
  runtime: ODataRuntime,
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI, never>,
  responseSchema: Schema.Schema<A, I, never>
): Promise<A> => runtime.runPromise(ODataFn.post(path, body, bodySchema, responseSchema))

/**
 * Update an entity using PATCH (MERGE in V2).
 *
 * @example
 * ```ts
 * await patch(
 *   runtime,
 *   "Products('1')",
 *   { Price: 15 },
 *   UpdateProductSchema,
 *   { etag: 'W/"123"' }
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const patch = <B, BI>(
  runtime: ODataRuntime,
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI, never>,
  requestOptions?: ODataRequestOptions
): Promise<void> => runtime.runPromise(ODataFn.patch(path, body, bodySchema, requestOptions))

/**
 * Delete an entity.
 *
 * @example
 * ```ts
 * await del(runtime, "Products('1')", { etag: 'W/"123"' })
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const del = (
  runtime: ODataRuntime,
  path: string,
  requestOptions?: ODataRequestOptions
): Promise<void> => runtime.runPromise(ODataFn.del(path, requestOptions))

// Alias for nice naming
export { del as delete }

// Re-export types for convenience
export type { ODataQueryOptions, ODataRequestOptions, PagedResult }

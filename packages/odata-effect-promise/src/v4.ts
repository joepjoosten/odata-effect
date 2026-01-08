/**
 * Tree-shakable OData V4 Promise functions.
 *
 * This module provides Promise-based functions for OData V4 operations.
 * Import only the functions you need for maximum tree-shaking.
 *
 * @example
 * ```ts
 * import { Runtime } from "@odata-effect/odata-effect-promise"
 * import * as v4 from "@odata-effect/odata-effect-promise/v4"
 *
 * const runtime = Runtime.createODataV4Runtime({
 *   baseUrl: "https://server.com",
 *   servicePath: "/odata/v4/"
 * })
 *
 * // Namespace import - nice autocomplete
 * const product = await v4.get(runtime, "Products(1)", ProductSchema)
 *
 * // Or create bound functions
 * const boundGet = (path, schema, opts) => v4.get(runtime, path, schema, opts)
 * const product2 = await boundGet("Products(2)", ProductSchema)
 *
 * await runtime.dispose()
 * ```
 *
 * @since 1.0.0
 */
import { ODataV4ClientFn as ODataV4Fn } from "@odata-effect/odata-effect"
import type * as Schema from "effect/Schema"
import type { ODataV4QueryOptions, ODataV4RequestOptions, ODataV4Runtime, PagedResultV4 } from "./Runtime.js"

/**
 * Fetch a single entity by path.
 * V4 returns the entity directly with optional @odata annotations.
 *
 * @example
 * ```ts
 * const product = await get(runtime, "Products(123)", ProductSchema)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const get = <A, I>(
  runtime: ODataV4Runtime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataV4QueryOptions
): Promise<A> => runtime.runPromise(ODataV4Fn.get(path, schema, options))

/**
 * Fetch a collection of entities.
 * V4 returns { value: [...] }
 *
 * @example
 * ```ts
 * const products = await getCollection(runtime, "Products", ProductSchema, {
 *   $filter: "Price gt 100",
 *   $orderby: "Name",
 *   $count: true
 * })
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollection = <A, I>(
  runtime: ODataV4Runtime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataV4QueryOptions
): Promise<ReadonlyArray<A>> => runtime.runPromise(ODataV4Fn.getCollection(path, schema, options))

/**
 * Fetch a collection with pagination metadata.
 * Use $count=true in options to get the total count.
 *
 * @example
 * ```ts
 * const result = await getCollectionPaged(runtime, "Products", ProductSchema, {
 *   $count: true,
 *   $top: 10
 * })
 * console.log(result.value, result.count, result.nextLink)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollectionPaged = <A, I>(
  runtime: ODataV4Runtime,
  path: string,
  schema: Schema.Schema<A, I, never>,
  options?: ODataV4QueryOptions
): Promise<PagedResultV4<A>> => runtime.runPromise(ODataV4Fn.getCollectionPaged(path, schema, options))

/**
 * Fetch a single property value.
 * V4 returns { value: T }
 *
 * @example
 * ```ts
 * const name = await getValue(runtime, "Products(1)/Name", Schema.String)
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const getValue = <A, I>(
  runtime: ODataV4Runtime,
  path: string,
  schema: Schema.Schema<A, I, never>
): Promise<A> => runtime.runPromise(ODataV4Fn.getValue(path, schema))

/**
 * Create a new entity.
 * V4 uses native POST and returns the created entity directly.
 *
 * @example
 * ```ts
 * const newProduct = await post(
 *   runtime,
 *   "Products",
 *   { Name: "Widget", Price: 10 },
 *   CreateProductSchema,
 *   ProductSchema,
 *   { prefer: { return: "representation" } }
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const post = <A, I, B, BI>(
  runtime: ODataV4Runtime,
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI, never>,
  responseSchema: Schema.Schema<A, I, never>,
  requestOptions?: ODataV4RequestOptions
): Promise<A> => runtime.runPromise(ODataV4Fn.post(path, body, bodySchema, responseSchema, requestOptions))

/**
 * Update an entity using PATCH.
 * V4 supports native PATCH method.
 *
 * @example
 * ```ts
 * await patch(
 *   runtime,
 *   "Products(1)",
 *   { Price: 15 },
 *   UpdateProductSchema,
 *   { etag: 'W/"abc123"' }
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const patch = <B, BI>(
  runtime: ODataV4Runtime,
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI, never>,
  requestOptions?: ODataV4RequestOptions
): Promise<void> => runtime.runPromise(ODataV4Fn.patch(path, body, bodySchema, requestOptions))

/**
 * Replace an entity using PUT.
 * V4 supports PUT for full replacement.
 *
 * @example
 * ```ts
 * await put(
 *   runtime,
 *   "Products(1)",
 *   { Name: "New Widget", Price: 20, Category: "Electronics" },
 *   ProductSchema,
 *   { etag: 'W/"abc123"' }
 * )
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const put = <B, BI>(
  runtime: ODataV4Runtime,
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI, never>,
  requestOptions?: ODataV4RequestOptions
): Promise<void> => runtime.runPromise(ODataV4Fn.put(path, body, bodySchema, requestOptions))

/**
 * Delete an entity.
 *
 * @example
 * ```ts
 * await del(runtime, "Products(1)", { etag: 'W/"abc123"' })
 * ```
 *
 * @since 1.0.0
 * @category operations
 */
export const del = (
  runtime: ODataV4Runtime,
  path: string,
  requestOptions?: ODataV4RequestOptions
): Promise<void> => runtime.runPromise(ODataV4Fn.del(path, requestOptions))

// Alias for nice naming
export { del as delete }

// Re-export types for convenience
export type { ODataV4QueryOptions, ODataV4RequestOptions, PagedResultV4 }

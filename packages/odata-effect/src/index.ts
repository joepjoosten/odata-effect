/**
 * OData Batch Request Support.
 *
 * Supports OData $batch operations for executing multiple requests in a single HTTP call.
 * - V2: Multipart/mixed format only
 * - V4: Multipart/mixed or JSON format
 *
 * @since 1.0.0
 */
export * as Batch from "./Batch.js"

/**
 * Error types for CI EMOB SMCH Customer OData service.
 *
 * @since 1.0.0
 */
export * as Errors from "./Errors.js"

/**
 * OData Media Entity Support.
 *
 * Provides functionality for working with OData media entities (binary content).
 * Supports both V2 and V4 media handling.
 *
 * @since 1.0.0
 */
export * as Media from "./Media.js"

/**
 * OData V2 types and schemas.
 *
 * @since 1.0.0
 */
export * as ODataClient from "./ODataClient.js"

/**
 * Tree-shakable OData V2 client functions.
 *
 * This module provides standalone functions that can be tree-shaken.
 * Use the namespace import for nice autocomplete, or import individual
 * functions for maximum tree-shaking.
 *
 * @example
 * ```ts
 * // Namespace import - nice autocomplete, tree-shakable
 * import { OData } from "@odata-effect/odata-effect"
 * const entity = yield* OData.get("Products('123')", ProductSchema)
 * const items = yield* OData.getCollection("Products", ProductSchema)
 *
 * // Direct import - maximum tree-shaking
 * import { get } from "@odata-effect/odata-effect/ODataClientFn"
 * const entity = yield* get("Products('123')", ProductSchema)
 * ```
 *
 * @since 1.0.0
 */
export * as ODataClientFn from "./ODataClientFn.js"

/**
 * OData V4 types and schemas.
 *
 * OData V4 uses different response formats than V2:
 * - Single entity: entity object with @odata.* annotations
 * - Collection: { value: [...], @odata.count?, @odata.nextLink? }
 * - Value: { value: T } or raw T for $value
 *
 * @since 1.0.0
 */
export * as ODataV4Client from "./ODataV4Client.js"

/**
 * Tree-shakable OData V4 client functions.
 *
 * This module provides standalone functions that can be tree-shaken.
 * Use the namespace import for nice autocomplete, or import individual
 * functions for maximum tree-shaking.
 *
 * @example
 * ```ts
 * // Namespace import - nice autocomplete, tree-shakable
 * import { ODataV4 } from "@odata-effect/odata-effect"
 * const entity = yield* ODataV4.get("Products(123)", ProductSchema)
 * const items = yield* ODataV4.getCollection("Products", ProductSchema)
 *
 * // Direct import - maximum tree-shaking
 * import { get } from "@odata-effect/odata-effect/ODataV4ClientFn"
 * const entity = yield* get("Products(123)", ProductSchema)
 * ```
 *
 * @since 1.0.0
 */
export * as ODataV4ClientFn from "./ODataV4ClientFn.js"

/**
 * OData Operations - Function Imports and Actions.
 *
 * OData V2: Function Imports (GET or POST based on side effects)
 * OData V4: Functions (GET, no side effects) and Actions (POST, with side effects)
 *
 * @since 1.0.0
 */
export * as Operations from "./Operations.js"

/**
 * Type-safe OData query builder using Effect Schema.
 *
 * This module provides a type-safe way to build OData queries based on
 * Effect Schema definitions. It uses the schema's structure to provide
 * compile-time type safety for $select, $filter, $expand, and $orderby.
 *
 * @since 1.0.0
 */
export * as QueryBuilder from "./QueryBuilder.js"

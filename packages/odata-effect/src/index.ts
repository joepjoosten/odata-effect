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
 * CRUD factory for OData V2 entity services.
 *
 * Creates type-safe CRUD operations for entity sets without code generation.
 *
 * @example
 * ```ts
 * import { Crud } from "@odata-effect/odata-effect"
 *
 * export const ProductService = Crud.crud({
 *   path: "Products",
 *   schema: Product,
 *   editableSchema: EditableProduct,
 *   idToKey: (id) => ({ ID: String(id) })
 * })
 * ```
 *
 * @since 1.0.0
 */
export * as Crud from "./Crud.js"

/**
 * CRUD factory for OData V4 entity services.
 *
 * Creates type-safe CRUD operations for entity sets without code generation.
 *
 * @example
 * ```ts
 * import { CrudV4 } from "@odata-effect/odata-effect"
 *
 * export const PersonService = CrudV4.crud({
 *   path: "People",
 *   schema: Person,
 *   editableSchema: EditablePerson,
 *   idToKey: (id) => ({ UserName: id })
 * })
 * ```
 *
 * @since 1.0.0
 */
export * as CrudV4 from "./CrudV4.js"

/**
 * Error types for OData services.
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
 * OData V2 client module.
 *
 * This module provides everything needed for OData V2 operations:
 * - Configuration context tag (ODataClientConfig)
 * - Response schemas for parsing OData responses
 * - Query options types
 * - Tree-shakable operation functions (get, post, patch, del)
 * - Utility functions for path building
 *
 * @example
 * ```ts
 * // Namespace import - nice autocomplete, tree-shakable
 * import { OData } from "@odata-effect/odata-effect"
 * const entity = yield* OData.get("Products('123')", ProductSchema)
 * const items = yield* OData.getCollection("Products", ProductSchema)
 *
 * // Direct import - maximum tree-shaking
 * import { get, ODataClientConfig } from "@odata-effect/odata-effect/OData"
 * const entity = yield* get("Products('123')", ProductSchema)
 * ```
 *
 * @since 1.0.0
 */
export * as OData from "./OData.js"

/**
 * OData V4 client module.
 *
 * This module provides everything needed for OData V4 operations:
 * - Configuration context tag (ODataV4ClientConfig)
 * - Response schemas for parsing OData responses
 * - Query options types
 * - Tree-shakable operation functions (get, post, patch, put, del)
 * - Utility functions for path building
 *
 * OData V4 uses different response formats than V2:
 * - Single entity: entity object with @odata.* annotations
 * - Collection: { value: [...], @odata.count?, @odata.nextLink? }
 * - Value: { value: T } or raw T for $value
 *
 * @example
 * ```ts
 * // Namespace import - nice autocomplete, tree-shakable
 * import { ODataV4 } from "@odata-effect/odata-effect"
 * const entity = yield* ODataV4.get("Products(123)", ProductSchema)
 * const items = yield* ODataV4.getCollection("Products", ProductSchema)
 *
 * // Direct import - maximum tree-shaking
 * import { get, ODataV4ClientConfig } from "@odata-effect/odata-effect/ODataV4"
 * const entity = yield* get("Products(123)", ProductSchema)
 * ```
 *
 * @since 1.0.0
 */
export * as ODataV4 from "./ODataV4.js"

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

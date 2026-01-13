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
 * OData client configuration.
 *
 * This module provides the unified configuration context tag used by both
 * OData V2 and V4 operations. Since V2 and V4 share the same configuration
 * structure (baseUrl and servicePath), a single config works for both.
 *
 * @example
 * ```ts
 * import { ODataClientConfig } from "@odata-effect/odata-effect/Config"
 * import * as Layer from "effect/Layer"
 *
 * const configLayer = Layer.succeed(ODataClientConfig, {
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 * ```
 *
 * @since 1.0.0
 */
export * as Config from "./Config.js"

/**
 * CRUD factory for OData V2 entity services.
 *
 * This module provides a factory function to create type-safe CRUD operations
 * for OData V2 entity sets. Instead of generating duplicate code for each entity,
 * use this factory with your entity schemas.
 *
 * @example
 * ```ts
 * import { crud } from "@odata-effect/odata-effect/Crud"
 * import { Product, ProductId, EditableProduct } from "./Models"
 *
 * export const ProductService = crud({
 *   path: "Products",
 *   schema: Product,
 *   editableSchema: EditableProduct,
 *   idToKey: (id: ProductId) => typeof id === "number"
 *     ? { ID: String(id) }
 *     : { ID: String(id.id) }
 * })
 *
 * // Usage:
 * const products = yield* ProductService.getAll()
 * const product = yield* ProductService.getById(123)
 * const created = yield* ProductService.create({ name: "Widget", price: 9.99 })
 * yield* ProductService.update(123, { price: 12.99 })
 * yield* ProductService.delete(123)
 * ```
 *
 * @since 1.0.0
 */
export * as Crud from "./Crud.js"

/**
 * CRUD factory for OData V4 entity services.
 *
 * This module provides a factory function to create type-safe CRUD operations
 * for OData V4 entity sets. Instead of generating duplicate code for each entity,
 * use this factory with your entity schemas.
 *
 * @example
 * ```ts
 * import { crud } from "@odata-effect/odata-effect/CrudV4"
 * import { Person, PersonId, EditablePerson } from "./Models"
 *
 * export const PersonService = crud({
 *   path: "People",
 *   schema: Person,
 *   editableSchema: EditablePerson,
 *   idToKey: (id: PersonId) => typeof id === "string"
 *     ? { UserName: id }
 *     : { UserName: id.userName }
 * })
 *
 * // Usage:
 * const people = yield* PersonService.getAll()
 * const person = yield* PersonService.getById("russellwhyte")
 * const created = yield* PersonService.create({ firstName: "John", lastName: "Doe" })
 * yield* PersonService.update("russellwhyte", { firstName: "Russell" })
 * yield* PersonService.delete("russellwhyte")
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
 * - Configuration context tag
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
 * OData-specific Effect Schema types for proper encoding/decoding of OData wire formats.
 *
 * OData V2 and V4 have different wire formats for dates, times, and numbers.
 * These schemas handle the transformation between wire format and Effect types.
 *
 * Uses Effect's built-in types for proper handling:
 * - DateTime.Utc / DateTime.Zoned for date/time values
 * - BigDecimal for precise decimal numbers (Int64, Decimal)
 * - Duration for time durations
 *
 * @since 1.0.0
 * @see https://odata2ts.github.io/docs/odata/odata-types
 */
export * as ODataSchema from "./ODataSchema.js"

/**
 * Shared OData URL value formatting for V2 and V4.
 *
 * Used by both QueryBuilder (for $filter expressions) and Operations (for function parameters).
 * Ensures consistent formatting of values in OData URLs.
 *
 * @since 1.0.0
 */
export * as ODataUrlFormat from "./ODataUrlFormat.js"

/**
 * OData V4 client module.
 *
 * This module provides everything needed for OData V4 operations:
 * - Configuration context tag
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
 * import { get, ODataClientConfig } from "@odata-effect/odata-effect/ODataV4"
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

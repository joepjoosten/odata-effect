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
import type { HttpClient } from "@effect/platform"
import type * as HttpBody from "@effect/platform/HttpBody"
import type * as HttpClientError from "@effect/platform/HttpClientError"
import type * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import type { ODataError, ParseError, SapError } from "./Errors.js"
import * as OData from "./OData.js"
import { buildEntityPath, type ODataClientConfig, type ODataQueryOptions } from "./OData.js"

// ============================================================================
// Types
// ============================================================================

/**
 * Key type for entity path building.
 * V2 uses string values for all key components.
 *
 * @since 1.0.0
 * @category models
 */
export type EntityKey = string | { [key: string]: string }

/**
 * Configuration for creating a CRUD service.
 *
 * @since 1.0.0
 * @category models
 */
export interface CrudConfig<
  TEntity,
  TEntityInput,
  TEditable,
  TEditableInput,
  TId
> {
  /** The entity set path (e.g., "Products", "Categories") */
  readonly path: string
  /** Schema for the entity type */
  readonly schema: Schema.Schema<TEntity, TEntityInput>
  /** Schema for creating/updating entities */
  readonly editableSchema: Schema.Schema<TEditable, TEditableInput>
  /** Function to convert ID to entity key */
  readonly idToKey: (id: TId) => EntityKey
}

/**
 * Error type for CRUD operations.
 *
 * @since 1.0.0
 * @category errors
 */
export type CrudError =
  | HttpClientError.HttpClientError
  | HttpBody.HttpBodyError
  | ParseError
  | SapError
  | ODataError

/**
 * Context required for CRUD operations.
 *
 * @since 1.0.0
 * @category context
 */
export type CrudContext = ODataClientConfig | HttpClient.HttpClient

/**
 * CRUD service interface.
 *
 * @since 1.0.0
 * @category models
 */
export interface CrudService<TEntity, TEditable, TId> {
  /** Fetch all entities */
  readonly getAll: (
    options?: ODataQueryOptions
  ) => Effect.Effect<ReadonlyArray<TEntity>, CrudError, CrudContext>

  /** Fetch a single entity by ID */
  readonly getById: (
    id: TId,
    options?: ODataQueryOptions
  ) => Effect.Effect<TEntity, CrudError, CrudContext>

  /** Create a new entity */
  readonly create: (
    entity: TEditable
  ) => Effect.Effect<TEntity, CrudError, CrudContext>

  /** Update an existing entity */
  readonly update: (
    id: TId,
    entity: Partial<TEditable>
  ) => Effect.Effect<void, CrudError, CrudContext>

  /** Delete an entity */
  readonly delete: (
    id: TId
  ) => Effect.Effect<void, CrudError, CrudContext>
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a CRUD service for an OData V2 entity set.
 *
 * @since 1.0.0
 * @category factory
 */
export const crud = <
  TEntity,
  TEntityInput,
  TEditable,
  TEditableInput,
  TId
>(
  config: CrudConfig<TEntity, TEntityInput, TEditable, TEditableInput, TId>
): CrudService<TEntity, TEditable, TId> => ({
  getAll: (options) => OData.getCollection(config.path, config.schema, options),

  getById: (id, options) =>
    OData.get(
      buildEntityPath(config.path, config.idToKey(id)),
      config.schema,
      options
    ),

  create: (entity) => OData.post(config.path, entity, config.editableSchema, config.schema),

  update: (id, entity) =>
    OData.patch(
      buildEntityPath(config.path, config.idToKey(id)),
      entity,
      Schema.partial(config.editableSchema)
    ),

  delete: (id) => OData.del(buildEntityPath(config.path, config.idToKey(id)))
})

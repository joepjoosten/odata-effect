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
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as Struct from "effect/Struct"
import type * as HttpBody from "effect/unstable/http/HttpBody"
import type * as HttpClient from "effect/unstable/http/HttpClient"
import type * as HttpClientError from "effect/unstable/http/HttpClientError"
import { type ODataError, ParseError, type SapError } from "./Errors.js"
import * as OData from "./OData.js"
import { buildEntityPath, type ODataClientConfig, type ODataQueryOptions } from "./OData.js"

// ============================================================================
// Types
// ============================================================================

/**
 * Key type for entity path building.
 * Supports string, number, and boolean key values.
 *
 * @since 1.0.0
 * @category models
 */
export type EntityKey = string | number | boolean | { [key: string]: string | number | boolean }

type StructEditableSchema<TEditable, TEditableInput> = Schema.Codec<TEditable, TEditableInput> & {
  readonly mapFields: (
    f: (fields: Schema.Struct.Fields) => Schema.Struct.Fields
  ) => Schema.Top
}

const partialSchema = <TEditable, TEditableInput>(
  schema: Schema.Codec<TEditable, TEditableInput>
): Schema.Codec<Partial<TEditable>, Partial<TEditableInput>> =>
  "mapFields" in schema && typeof schema.mapFields === "function"
    ? (schema as StructEditableSchema<TEditable, TEditableInput>).mapFields(
      Struct.map(Schema.optional)
    ) as unknown as Schema.Codec<
      Partial<TEditable>,
      Partial<TEditableInput>
    >
    : schema as unknown as Schema.Codec<Partial<TEditable>, Partial<TEditableInput>>

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
  TId,
  TCreate = TEditable,
  TCreateInput = TEditableInput
> {
  /** The entity set path (e.g., "Products", "Categories") */
  readonly path: string
  /** Schema for the entity type */
  readonly schema: Schema.Codec<TEntity, TEntityInput>
  /** Schema for creating/updating entities */
  readonly editableSchema: Schema.Codec<TEditable, TEditableInput>
  /** Optional create schema; defaults to editableSchema for existing callers. */
  readonly createSchema?: Schema.Codec<TCreate, TCreateInput>
  /** Optional schema for partial update bodies. Required for transformed editable schemas. */
  readonly partialEditableSchema?: Schema.Codec<
    { readonly [K in keyof TEditable]?: TEditable[K] | undefined },
    { readonly [K in keyof TEditableInput]?: TEditableInput[K] | undefined }
  >
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
export interface CrudService<TEntity, TEditable, TId, TCreate = TEditable> {
  /** Fetch all entities */
  readonly getAll: (
    options?: ODataQueryOptions
  ) => Effect.Effect<ReadonlyArray<TEntity>, CrudError, CrudContext>

  /** Fetch a single entity by ID */
  readonly getById: (
    id: TId,
    options?: ODataQueryOptions
  ) => Effect.Effect<TEntity, CrudError, CrudContext>

  /** Fetch a projection using an explicit response schema. */
  readonly getAllWithSchema: <A, I, R>(
    schema: Schema.Codec<A, I, R>,
    options?: ODataQueryOptions
  ) => Effect.Effect<ReadonlyArray<A>, CrudError, CrudContext | R>

  /** Fetch a single projected entity using an explicit response schema. */
  readonly getByIdWithSchema: <A, I, R>(
    id: TId,
    schema: Schema.Codec<A, I, R>,
    options?: ODataQueryOptions
  ) => Effect.Effect<A, CrudError, CrudContext | R>

  /** Create a new entity */
  readonly create: (
    entity: TCreate
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
  TId,
  TCreate = TEditable,
  TCreateInput = TEditableInput
>(
  config: CrudConfig<TEntity, TEntityInput, TEditable, TEditableInput, TId, TCreate, TCreateInput>
): CrudService<TEntity, TEditable, TId, TCreate> => ({
  getAll: (options) => readCollection(config.path, config.schema, options),

  getById: (id, options) =>
    readOne(
      buildEntityPath(config.path, config.idToKey(id)),
      config.schema,
      options
    ),

  getAllWithSchema: (schema, options) => OData.getCollection(config.path, schema, options),

  getByIdWithSchema: (id, schema, options) =>
    OData.get(buildEntityPath(config.path, config.idToKey(id)), schema, options),

  create: (entity) =>
    OData.post(
      config.path,
      entity,
      (config.createSchema ?? config.editableSchema) as Schema.Codec<TCreate, TCreateInput>,
      config.schema
    ),

  update: (id, entity) =>
    OData.patch(
      buildEntityPath(config.path, config.idToKey(id)),
      entity,
      config.partialEditableSchema ?? partialSchema(config.editableSchema)
    ),

  delete: (id) => OData.del(buildEntityPath(config.path, config.idToKey(id)))
})

const hasProjection = (options?: ODataQueryOptions): boolean =>
  (!!options?.$select && options.$select !== "*") || /\$select\s*=/.test(options?.$expand ?? "")

/**
 * Read a full collection, rejecting projections without an explicit response schema.
 * @since 1.3.0
 * @category operations
 */
export const readCollection = <A, I, R>(path: string, schema: Schema.Codec<A, I, R>, options?: ODataQueryOptions) =>
  hasProjection(options)
    ? Effect.fail(
      new ParseError({
        message: "Projected reads require getAllWithSchema (or the core getCollection with a projection schema)"
      })
    )
    : OData.getCollection(path, schema, options)

/**
 * Read a full entity, rejecting projections without an explicit response schema.
 * @since 1.3.0
 * @category operations
 */
export const readOne = <A, I, R>(path: string, schema: Schema.Codec<A, I, R>, options?: ODataQueryOptions) =>
  hasProjection(options)
    ? Effect.fail(
      new ParseError({
        message: "Projected reads require getByIdWithSchema (or the core get with a projection schema)"
      })
    )
    : OData.get(path, schema, options)

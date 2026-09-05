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
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as Struct from "effect/Struct"
import type * as HttpBody from "effect/unstable/http/HttpBody"
import type * as HttpClient from "effect/unstable/http/HttpClient"
import type * as HttpClientError from "effect/unstable/http/HttpClientError"
import type { ODataClientConfig } from "./Config.js"
import { type ODataError, ParseError } from "./Errors.js"
import * as ODataV4 from "./ODataV4.js"
import { buildEntityPathV4, type ODataV4QueryOptions } from "./ODataV4.js"

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
  TId
> {
  /** The entity set path (e.g., "People", "Products") */
  readonly path: string
  /** Schema for the entity type */
  readonly schema: Schema.Codec<TEntity, TEntityInput>
  /** Schema for creating/updating entities */
  readonly editableSchema: Schema.Codec<TEditable, TEditableInput>
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
    options?: ODataV4QueryOptions
  ) => Effect.Effect<ReadonlyArray<TEntity>, CrudError, CrudContext>

  /** Fetch a single entity by ID */
  readonly getById: (
    id: TId,
    options?: ODataV4QueryOptions
  ) => Effect.Effect<TEntity, CrudError, CrudContext>

  /** Fetch a projection using an explicit response schema. */
  readonly getAllWithSchema: <A, I, R>(
    schema: Schema.Codec<A, I, R>,
    options?: ODataV4QueryOptions
  ) => Effect.Effect<ReadonlyArray<A>, CrudError, CrudContext | R>

  /** Fetch a single projected entity using an explicit response schema. */
  readonly getByIdWithSchema: <A, I, R>(
    id: TId,
    schema: Schema.Codec<A, I, R>,
    options?: ODataV4QueryOptions
  ) => Effect.Effect<A, CrudError, CrudContext | R>

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
 * Create a CRUD service for an OData V4 entity set.
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
  getAll: (options) => readCollection(config.path, config.schema, options),

  getById: (id, options) =>
    readOne(
      buildEntityPathV4(config.path, config.idToKey(id)),
      config.schema,
      options
    ),

  getAllWithSchema: (schema, options) => ODataV4.getCollection(config.path, schema, options),

  getByIdWithSchema: (id, schema, options) =>
    ODataV4.get(buildEntityPathV4(config.path, config.idToKey(id)), schema, options),

  create: (entity) => ODataV4.post(config.path, entity, config.editableSchema, config.schema),

  update: (id, entity) =>
    ODataV4.patch(
      buildEntityPathV4(config.path, config.idToKey(id)),
      entity,
      config.partialEditableSchema ?? partialSchema(config.editableSchema)
    ),

  delete: (id) => ODataV4.del(buildEntityPathV4(config.path, config.idToKey(id)))
})

const hasProjection = (options?: ODataV4QueryOptions): boolean =>
  (!!options?.$select && options.$select !== "*") || /\$select\s*=/.test(options?.$expand ?? "")

/**
 * Read a full collection, rejecting projections without an explicit response schema.
 * @since 1.3.0
 * @category operations
 */
export const readCollection = <A, I, R>(path: string, schema: Schema.Codec<A, I, R>, options?: ODataV4QueryOptions) =>
  hasProjection(options)
    ? Effect.fail(
      new ParseError({
        message: "Projected reads require getAllWithSchema (or the core getCollection with a projection schema)"
      })
    )
    : ODataV4.getCollection(path, schema, options)

/**
 * Read a full entity, rejecting projections without an explicit response schema.
 * @since 1.3.0
 * @category operations
 */
export const readOne = <A, I, R>(path: string, schema: Schema.Codec<A, I, R>, options?: ODataV4QueryOptions) =>
  hasProjection(options)
    ? Effect.fail(
      new ParseError({
        message: "Projected reads require getByIdWithSchema (or the core get with a projection schema)"
      })
    )
    : ODataV4.get(path, schema, options)

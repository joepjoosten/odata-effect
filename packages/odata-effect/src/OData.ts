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
import {
  type HttpBody,
  HttpClient,
  type HttpClientError,
  HttpClientRequest,
  HttpClientResponse
} from "@effect/platform"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { ODataClientConfig } from "./Config.js"
import type { ParseError, SapError } from "./Errors.js"
import { ODataError } from "./Errors.js"

// Re-export config for backward compatibility
export { ODataClientConfig, type ODataClientConfigService } from "./Config.js"

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * OData response wrapper for single entities.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataSingleResponse = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    d: schema
  })

/**
 * OData response wrapper for collections.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataCollectionResponse = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    d: Schema.Struct({
      results: Schema.Array(schema)
    })
  })

/**
 * OData V2 collection response with pagination metadata.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataCollectionResponseWithMeta = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    d: Schema.Struct({
      results: Schema.Array(schema),
      __count: Schema.optionalWith(Schema.String, { nullable: true }),
      __next: Schema.optionalWith(Schema.String, { nullable: true })
    })
  })

/**
 * OData V2 entity metadata embedded in responses.
 *
 * @since 1.0.0
 * @category schemas
 */
export const EntityMetadata = Schema.Struct({
  uri: Schema.String,
  type: Schema.optionalWith(Schema.String, { nullable: true }),
  etag: Schema.optionalWith(Schema.String, { nullable: true }),
  id: Schema.optionalWith(Schema.String, { nullable: true })
})

/**
 * Type for entity metadata.
 *
 * @since 1.0.0
 * @category models
 */
export type EntityMetadata = typeof EntityMetadata.Type

/**
 * OData V2 media entity metadata for binary content.
 *
 * @since 1.0.0
 * @category schemas
 */
export const MediaMetadata = Schema.Struct({
  uri: Schema.String,
  type: Schema.optionalWith(Schema.String, { nullable: true }),
  etag: Schema.optionalWith(Schema.String, { nullable: true }),
  media_src: Schema.String,
  media_etag: Schema.optionalWith(Schema.String, { nullable: true }),
  edit_media: Schema.optionalWith(Schema.String, { nullable: true }),
  content_type: Schema.optionalWith(Schema.String, { nullable: true })
})

/**
 * Type for media metadata.
 *
 * @since 1.0.0
 * @category models
 */
export type MediaMetadata = typeof MediaMetadata.Type

/**
 * OData V2 deferred content for lazy-loaded navigation properties.
 *
 * @since 1.0.0
 * @category schemas
 */
export const DeferredContent = Schema.Struct({
  __deferred: Schema.Struct({
    uri: Schema.String
  })
})

/**
 * Type for deferred content.
 *
 * @since 1.0.0
 * @category models
 */
export type DeferredContent = typeof DeferredContent.Type

/**
 * OData V2 value response wrapper for single property access.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataValueResponse = <A, I, R>(propertyName: string, schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    d: Schema.Struct({
      [propertyName]: schema
    })
  })

// ============================================================================
// Query Options & Request Options
// ============================================================================

/**
 * Result of a paged collection query including metadata.
 *
 * @since 1.0.0
 * @category models
 */
export interface PagedResult<A> {
  readonly results: ReadonlyArray<A>
  readonly count: number | undefined
  readonly nextLink: string | undefined
}

/**
 * OData query options for filtering, selecting, and expanding data.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataQueryOptions {
  readonly $filter?: string
  readonly $select?: string
  readonly $expand?: string
  readonly $orderby?: string
  readonly $top?: number
  readonly $skip?: number
  readonly $count?: boolean
  readonly $inlinecount?: "allpages" | "none"
}

/**
 * Request options for operations that support concurrency control.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataRequestOptions {
  /** ETag value for If-Match header (optimistic concurrency) */
  readonly etag?: string
  /** Set to true to use If-Match: * (force update/delete) */
  readonly forceUpdate?: boolean
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default headers for OData V2 JSON requests.
 *
 * @since 1.0.0
 * @category constants
 */
export const DEFAULT_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json"
} as const

/**
 * Headers for OData V2 MERGE operations (used for PATCH semantics).
 * OData V2 doesn't support native PATCH, so we use POST with X-Http-Method: MERGE.
 *
 * @since 1.0.0
 * @category constants
 */
export const MERGE_HEADERS = {
  "X-Http-Method": "MERGE"
} as const

// ============================================================================
// Utilities
// ============================================================================

/**
 * Builds an entity path with the given ID.
 *
 * @since 1.0.0
 * @category utils
 */
export const buildEntityPath = (
  entitySet: string,
  id: string | { [key: string]: string }
): string => {
  const extractIdFromPath = (id: string | { [key: string]: string }): string => {
    if (typeof id === "string") {
      return `'${id}'`
    }
    const entries = Object.entries(id)
    if (entries.length === 1) {
      return `'${entries[0][1]}'`
    }
    return entries.map(([key, value]) => `${key}='${value}'`).join(",")
  }
  return `${entitySet}(${extractIdFromPath(id)})`
}

/**
 * Extract the relative path from an absolute URI.
 * Deferred URIs in OData V2 are typically absolute URLs.
 *
 * @since 1.0.0
 * @category utils
 */
export const extractRelativePath = (
  absoluteUri: string,
  baseUrl: string,
  servicePath: string
): string => {
  const fullPrefix = `${baseUrl}${servicePath}`
  if (absoluteUri.startsWith(fullPrefix)) {
    return absoluteUri.slice(fullPrefix.length)
  }
  // If the URI doesn't start with the expected prefix, try just the service path
  if (absoluteUri.startsWith(servicePath)) {
    return absoluteUri.slice(servicePath.length)
  }
  // Return as-is if we can't determine the relative path
  return absoluteUri
}

// ============================================================================
// Internal Helpers
// ============================================================================

const buildQueryString = (options?: ODataQueryOptions): string => {
  if (!options) return ""
  const params: Array<string> = []
  if (options.$filter) params.push(`$filter=${encodeURIComponent(options.$filter)}`)
  if (options.$select) params.push(`$select=${encodeURIComponent(options.$select)}`)
  if (options.$expand) params.push(`$expand=${encodeURIComponent(options.$expand)}`)
  if (options.$orderby) params.push(`$orderby=${encodeURIComponent(options.$orderby)}`)
  if (options.$top !== undefined) params.push(`$top=${options.$top}`)
  if (options.$skip !== undefined) params.push(`$skip=${options.$skip}`)
  if (options.$inlinecount) params.push(`$inlinecount=${options.$inlinecount}`)
  return params.length > 0 ? `?${params.join("&")}` : ""
}

const handleError = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E | SapError | ODataError, R> =>
  Effect.catchAll(effect, (error) =>
    Effect.fail(
      new ODataError({
        message: "OData request failed",
        cause: error
      })
    ))

// ============================================================================
// Standalone Tree-Shakable Functions
// ============================================================================

/**
 * Fetch a single entity by path.
 *
 * @since 1.0.0
 * @category operations
 * @example
 * ```ts
 * import { get } from "@odata-effect/odata-effect/OData"
 *
 * const entity = yield* get("Products('123')", ProductSchema)
 * ```
 */
export const get = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataQueryOptions
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`
  const responseSchema = ODataSingleResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.d
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a collection of entities.
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollection = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataQueryOptions
): Effect.Effect<
  ReadonlyArray<A>,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`
  const responseSchema = ODataCollectionResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.d.results
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a collection with pagination metadata.
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollectionPaged = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataQueryOptions
): Effect.Effect<
  PagedResult<A>,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`
  const responseSchema = ODataCollectionResponseWithMeta(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return {
      results: data.d.results,
      count: data.d.__count !== undefined ? parseInt(data.d.__count, 10) : undefined,
      nextLink: data.d.__next ?? undefined
    }
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a single property value.
 *
 * @since 1.0.0
 * @category operations
 */
export const getValue = <A, I, R>(
  path: string,
  propertyName: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const responseSchema = ODataValueResponse(propertyName, schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const request = HttpClientRequest.get(path)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return (data.d as Record<string, A>)[propertyName]
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a complex property.
 *
 * @since 1.0.0
 * @category operations
 */
export const getComplex = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const responseSchema = ODataSingleResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const request = HttpClientRequest.get(path)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.d
  }).pipe(Effect.scoped, handleError)
}

/**
 * Expand a deferred navigation property.
 *
 * @since 1.0.0
 * @category operations
 */
export const expandDeferred = <A, I, R>(
  deferred: { readonly __deferred: { readonly uri: string } },
  schema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const responseSchema = ODataSingleResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const uri = deferred.__deferred.uri
    const relativePath = extractRelativePath(uri, config.baseUrl, config.servicePath)
    const request = HttpClientRequest.get(relativePath)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.d
  }).pipe(Effect.scoped, handleError)
}

/**
 * Expand a deferred navigation property collection.
 *
 * @since 1.0.0
 * @category operations
 */
export const expandDeferredCollection = <A, I, R>(
  deferred: { readonly __deferred: { readonly uri: string } },
  schema: Schema.Schema<A, I, R>
): Effect.Effect<
  ReadonlyArray<A>,
  HttpClientError.HttpClientError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const responseSchema = ODataCollectionResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      )
    )

    const uri = deferred.__deferred.uri
    const relativePath = extractRelativePath(uri, config.baseUrl, config.servicePath)
    const request = HttpClientRequest.get(relativePath)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.d.results
  }).pipe(Effect.scoped, handleError)
}

/**
 * Create a new entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const post = <A, I, R, B, BI>(
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI>,
  responseSchema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | HttpBody.HttpBodyError | ParseError | SapError | ODataError,
  R | ODataClientConfig | HttpClient.HttpClient
> => {
  const wrappedResponseSchema = ODataSingleResponse(responseSchema)

  return Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Content-Type", "application/json")
      )
    )

    const baseRequest = HttpClientRequest.post(path)
    const request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(baseRequest, body)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(wrappedResponseSchema)(response)
    return data.d
  }).pipe(Effect.scoped, handleError)
}

/**
 * Update an entity using PATCH (MERGE in V2).
 *
 * @since 1.0.0
 * @category operations
 */
export const patch = <B, BI>(
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI>,
  requestOptions?: ODataRequestOptions
): Effect.Effect<
  void,
  HttpClientError.HttpClientError | HttpBody.HttpBodyError | SapError | ODataError,
  ODataClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Accept", "application/json")
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("Content-Type", "application/json")
      )
    )

    // OData V2 uses POST with X-Http-Method: MERGE header
    let baseRequest = HttpClientRequest.post(path).pipe(
      HttpClientRequest.setHeader("X-Http-Method", "MERGE")
    )

    if (requestOptions?.forceUpdate) {
      baseRequest = HttpClientRequest.setHeader("If-Match", "*")(baseRequest)
    } else if (requestOptions?.etag) {
      baseRequest = HttpClientRequest.setHeader("If-Match", requestOptions.etag)(baseRequest)
    }

    const request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(baseRequest, body)
    yield* client.execute(request)
  }).pipe(Effect.scoped, handleError)

/**
 * Delete an entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const del = (
  path: string,
  requestOptions?: ODataRequestOptions
): Effect.Effect<
  void,
  HttpClientError.HttpClientError | SapError | ODataError,
  ODataClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      )
    )

    // Use POST with X-HTTP-Method header when tunneling is enabled
    let request = config.useTunneling
      ? HttpClientRequest.post(path).pipe(
        HttpClientRequest.setHeader("X-HTTP-Method", "DELETE")
      )
      : HttpClientRequest.del(path)

    if (requestOptions?.forceUpdate) {
      request = HttpClientRequest.setHeader("If-Match", "*")(request)
    } else if (requestOptions?.etag) {
      request = HttpClientRequest.setHeader("If-Match", requestOptions.etag)(request)
    }

    yield* client.execute(request)
  }).pipe(Effect.scoped, handleError)

// Alias for nice naming
export { del as delete }

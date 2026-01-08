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
 * import { ODataClientFn } from "@odata-effect/odata-effect"
 * const entity = yield* ODataClientFn.get("Products('123')", ProductSchema)
 * const items = yield* ODataClientFn.getCollection("Products", ProductSchema)
 *
 * // Direct import - maximum tree-shaking
 * import { get } from "@odata-effect/odata-effect/ODataClientFn"
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
import type * as Schema from "effect/Schema"
import type { ParseError, SapError } from "./Errors.js"
import { ODataError } from "./Errors.js"
import {
  extractRelativePath,
  ODataClientConfig,
  ODataCollectionResponse,
  ODataCollectionResponseWithMeta,
  type ODataQueryOptions,
  type ODataRequestOptions,
  ODataSingleResponse,
  ODataValueResponse,
  type PagedResult
} from "./ODataClient.js"

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
 * import { get } from "@odata-effect/odata-effect/ODataClientFn"
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

    let request = HttpClientRequest.del(path)

    if (requestOptions?.forceUpdate) {
      request = HttpClientRequest.setHeader("If-Match", "*")(request)
    } else if (requestOptions?.etag) {
      request = HttpClientRequest.setHeader("If-Match", requestOptions.etag)(request)
    }

    yield* client.execute(request)
  }).pipe(Effect.scoped, handleError)

// Alias for nice naming
export { del as delete }

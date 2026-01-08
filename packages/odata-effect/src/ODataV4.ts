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
 * import { get } from "@odata-effect/odata-effect/ODataV4"
 * const entity = yield* get("Products(123)", ProductSchema)
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
import type { ParseError } from "./Errors.js"
import { ODataError } from "./Errors.js"
import {
  ODataV4ClientConfig,
  ODataV4CollectionResponse,
  type ODataV4QueryOptions,
  type ODataV4RequestOptions,
  ODataV4ValueResponse,
  type PagedResultV4
} from "./ODataV4Client.js"

// ============================================================================
// Internal Helpers
// ============================================================================

const buildQueryString = (options?: ODataV4QueryOptions): string => {
  if (!options) return ""
  const params: Array<string> = []
  if (options.$filter) params.push(`$filter=${encodeURIComponent(options.$filter)}`)
  if (options.$select) params.push(`$select=${encodeURIComponent(options.$select)}`)
  if (options.$expand) params.push(`$expand=${encodeURIComponent(options.$expand)}`)
  if (options.$orderby) params.push(`$orderby=${encodeURIComponent(options.$orderby)}`)
  if (options.$top !== undefined) params.push(`$top=${options.$top}`)
  if (options.$skip !== undefined) params.push(`$skip=${options.$skip}`)
  if (options.$count) params.push(`$count=true`)
  if (options.$search) params.push(`$search=${encodeURIComponent(options.$search)}`)
  if (options.$compute) params.push(`$compute=${encodeURIComponent(options.$compute)}`)
  if (options.$apply) params.push(`$apply=${encodeURIComponent(options.$apply)}`)
  return params.length > 0 ? `?${params.join("&")}` : ""
}

const buildPreferHeader = (prefer?: ODataV4RequestOptions["prefer"]): string | undefined => {
  if (!prefer) return undefined
  const parts: Array<string> = []
  if (prefer.return) parts.push(`return=${prefer.return}`)
  if (prefer.maxPageSize) parts.push(`maxpagesize=${prefer.maxPageSize}`)
  if (prefer.includeCount) parts.push("odata.track-changes")
  return parts.length > 0 ? parts.join(", ") : undefined
}

const applyRequestOptions = (
  request: HttpClientRequest.HttpClientRequest,
  options?: ODataV4RequestOptions
): HttpClientRequest.HttpClientRequest => {
  let result = request

  if (options?.forceUpdate) {
    result = HttpClientRequest.setHeader("If-Match", "*")(result)
  } else if (options?.etag) {
    result = HttpClientRequest.setHeader("If-Match", options.etag)(result)
  }

  const prefer = buildPreferHeader(options?.prefer)
  if (prefer) {
    result = HttpClientRequest.setHeader("Prefer", prefer)(result)
  }

  return result
}

const handleError = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E | ODataError, R> =>
  Effect.catchAll(effect, (error) =>
    Effect.fail(
      new ODataError({
        message: "OData V4 request failed",
        cause: error
      })
    ))

// ============================================================================
// Standalone Tree-Shakable Functions
// ============================================================================

/**
 * Fetch a single entity by path.
 * V4 returns the entity directly with optional @odata annotations.
 *
 * @since 1.0.0
 * @category operations
 */
export const get = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataV4QueryOptions
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | ODataError,
  R | ODataV4ClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`

  return Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(schema)(response)
    return data
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a collection of entities.
 * V4 returns { value: [...] }
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollection = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataV4QueryOptions
): Effect.Effect<
  ReadonlyArray<A>,
  HttpClientError.HttpClientError | ParseError | ODataError,
  R | ODataV4ClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`
  const responseSchema = ODataV4CollectionResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.value
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a collection with pagination metadata.
 * Use $count=true in options to get the total count.
 *
 * @since 1.0.0
 * @category operations
 */
export const getCollectionPaged = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>,
  options?: ODataV4QueryOptions
): Effect.Effect<
  PagedResultV4<A>,
  HttpClientError.HttpClientError | ParseError | ODataError,
  R | ODataV4ClientConfig | HttpClient.HttpClient
> => {
  const url = `${path}${buildQueryString(options)}`
  const responseSchema = ODataV4CollectionResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    const request = HttpClientRequest.get(url)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return {
      value: data.value,
      count: data["@odata.count"] ?? undefined,
      nextLink: data["@odata.nextLink"] ?? undefined,
      context: data["@odata.context"] ?? undefined
    }
  }).pipe(Effect.scoped, handleError)
}

/**
 * Fetch a single property value.
 * V4 returns { value: T }
 *
 * @since 1.0.0
 * @category operations
 */
export const getValue = <A, I, R>(
  path: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | ParseError | ODataError,
  R | ODataV4ClientConfig | HttpClient.HttpClient
> => {
  const responseSchema = ODataV4ValueResponse(schema)

  return Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    const request = HttpClientRequest.get(path)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.value
  }).pipe(Effect.scoped, handleError)
}

/**
 * Create a new entity.
 * V4 uses native POST and returns the created entity directly.
 *
 * @since 1.0.0
 * @category operations
 */
export const post = <A, I, R, B, BI>(
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI>,
  responseSchema: Schema.Schema<A, I, R>,
  requestOptions?: ODataV4RequestOptions
): Effect.Effect<
  A,
  HttpClientError.HttpClientError | HttpBody.HttpBodyError | ParseError | ODataError,
  R | ODataV4ClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    let baseRequest = HttpClientRequest.post(path)
    baseRequest = applyRequestOptions(baseRequest, requestOptions)
    const request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(baseRequest, body)
    const response = yield* client.execute(request)
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data
  }).pipe(Effect.scoped, handleError)

/**
 * Update an entity using PATCH.
 * V4 supports native PATCH method.
 *
 * @since 1.0.0
 * @category operations
 */
export const patch = <B, BI>(
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI>,
  requestOptions?: ODataV4RequestOptions
): Effect.Effect<
  void,
  HttpClientError.HttpClientError | HttpBody.HttpBodyError | ODataError,
  ODataV4ClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    let baseRequest = HttpClientRequest.patch(path)
    baseRequest = applyRequestOptions(baseRequest, requestOptions)
    const request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(baseRequest, body)
    yield* client.execute(request)
  }).pipe(Effect.scoped, handleError)

/**
 * Replace an entity using PUT.
 * V4 supports PUT for full replacement.
 *
 * @since 1.0.0
 * @category operations
 */
export const put = <B, BI>(
  path: string,
  body: B,
  bodySchema: Schema.Schema<B, BI>,
  requestOptions?: ODataV4RequestOptions
): Effect.Effect<
  void,
  HttpClientError.HttpClientError | HttpBody.HttpBodyError | ODataError,
  ODataV4ClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
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
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    let baseRequest = HttpClientRequest.put(path)
    baseRequest = applyRequestOptions(baseRequest, requestOptions)
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
  requestOptions?: ODataV4RequestOptions
): Effect.Effect<
  void,
  HttpClientError.HttpClientError | ODataError,
  ODataV4ClientConfig | HttpClient.HttpClient
> =>
  Effect.gen(function*() {
    const config = yield* ODataV4ClientConfig
    const httpClient = yield* HttpClient.HttpClient

    const client = httpClient.pipe(
      HttpClient.filterStatusOk,
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl(`${config.baseUrl}${config.servicePath}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader("OData-Version", "4.0")
      )
    )

    let request = HttpClientRequest.del(path)
    request = applyRequestOptions(request, requestOptions)
    yield* client.execute(request)
  }).pipe(Effect.scoped, handleError)

// Alias for nice naming
export { del as delete }

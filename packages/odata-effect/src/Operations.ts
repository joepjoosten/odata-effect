/**
 * OData Operations - Function Imports and Actions.
 *
 * OData V2: Function Imports (GET or POST based on side effects)
 * OData V4: Functions (GET, no side effects) and Actions (POST, with side effects)
 *
 * @since 1.0.0
 */
import { HttpClient, type HttpClientError, HttpClientRequest, HttpClientResponse } from "@effect/platform"
import type * as BigDecimal from "effect/BigDecimal"
import type * as DateTime from "effect/DateTime"
import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import type { ODataClientConfigService } from "./Config.js"
import type { ParseError } from "./Errors.js"
import { ODataError } from "./Errors.js"
import { ODataCollectionResponse, ODataSingleResponse } from "./OData.js"
import type { Int64 } from "./ODataSchema.js"
import { encodeUrlValue, formatV2UrlValue, formatV4UrlValue } from "./ODataUrlFormat.js"
import { ODataV4CollectionResponse, ODataV4ValueResponse } from "./ODataV4.js"

// ============================================================================
// Operation Parameter Types
// ============================================================================

/**
 * Parameters for an OData operation.
 *
 * Supports primitive types, Effect types, and JavaScript Date:
 * - `string`, `number`, `boolean` - Basic primitives
 * - `Date` - JavaScript Date (serialized as ISO datetime)
 * - `DateTime.Utc`, `DateTime.Zoned` - Effect DateTime types
 * - `Duration.Duration` - Effect Duration type (serialized as ISO 8601 duration)
 * - `Int64` - OData Int64 type (V2: serialized with 'L' suffix)
 * - `BigDecimal.BigDecimal` - Effect BigDecimal type (V2: serialized with 'M' suffix)
 *
 * @since 1.0.0
 * @category models
 */
export type OperationParameters = Record<
  string,
  | string
  | number
  | boolean
  | Date
  | DateTime.Utc
  | DateTime.Zoned
  | Duration.Duration
  | Int64
  | BigDecimal.BigDecimal
  | null
  | undefined
>

/**
 * Return type specification for operations.
 *
 * @since 1.0.0
 * @category models
 */
export type OperationReturnType = "void" | "entity" | "collection" | "primitive"

// ============================================================================
// V2 Function Imports
// ============================================================================

/**
 * Options for V2 function import calls.
 *
 * @since 1.0.0
 * @category models
 */
export interface FunctionImportOptions {
  /** HTTP method to use (default: GET for queries, POST for actions) */
  readonly method?: "GET" | "POST"
}

/**
 * Format a V2 parameter for URL query string.
 * Strings are URL-encoded for safe transmission.
 *
 * @since 1.0.0
 * @category utils
 */
const formatV2Parameter = (key: string, value: NonNullable<OperationParameters[string]>): string => {
  if (typeof value === "string") {
    // URL-encode string values for query parameters
    return `${key}='${encodeUrlValue(value)}'`
  }
  return `${key}=${formatV2UrlValue(value)}`
}

/**
 * Build a function import URL with parameters.
 *
 * @since 1.0.0
 * @category utils
 */
export const buildFunctionImportUrl = (
  functionName: string,
  parameters?: OperationParameters
): string => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return functionName
  }

  const params = Object.entries(parameters)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (value === null) {
        return `${key}=null`
      }
      return formatV2Parameter(key, value!)
    })
    .join(",")

  if (!params) {
    return functionName
  }

  return `${functionName}?${params}`
}

/**
 * Execute a V2 function import that returns void.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeFunctionImportVoid = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionName: string,
  parameters?: OperationParameters,
  options?: FunctionImportOptions
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${buildFunctionImportUrl(functionName, parameters)}`
  const method = options?.method ?? "POST"

  return Effect.gen(function*() {
    const request = method === "GET"
      ? HttpClientRequest.get(url)
      : HttpClientRequest.post(url)

    const configuredRequest = request.pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(configuredRequest)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "Function import failed", cause: error })))
  )
}

/**
 * Execute a V2 function import that returns a single entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeFunctionImportEntity = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionName: string,
  schema: Schema.Schema<A, I, R>,
  parameters?: OperationParameters,
  options?: FunctionImportOptions
): Effect.Effect<A, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${buildFunctionImportUrl(functionName, parameters)}`
  const method = options?.method ?? "GET"
  const responseSchema = ODataSingleResponse(schema)

  return Effect.gen(function*() {
    const request = method === "GET"
      ? HttpClientRequest.get(url)
      : HttpClientRequest.post(url)

    const configuredRequest = request.pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(configuredRequest)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    // Handle V2 ({ d: Entity }) and V3/V4 (Entity at root) formats
    if (data !== null && typeof data === "object" && "d" in data) {
      return (data as { readonly d: A }).d
    }
    return data as A
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "Function import failed", cause: error })))
  )
}

/**
 * Execute a V2 function import that returns a collection.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeFunctionImportCollection = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionName: string,
  schema: Schema.Schema<A, I, R>,
  parameters?: OperationParameters,
  options?: FunctionImportOptions
): Effect.Effect<ReadonlyArray<A>, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${buildFunctionImportUrl(functionName, parameters)}`
  const method = options?.method ?? "GET"
  const responseSchema = ODataCollectionResponse(schema)

  return Effect.gen(function*() {
    const request = method === "GET"
      ? HttpClientRequest.get(url)
      : HttpClientRequest.post(url)

    const configuredRequest = request.pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(configuredRequest)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    // Handle V2 ({ d: { results: [...] } }, { d: [...] }) and V3/V4 ({ value: [...] }) formats
    if ("value" in data) {
      return data.value // V3/V4 format
    }
    const results = Array.isArray(data.d) ? data.d : (data.d as { readonly results: ReadonlyArray<A> }).results
    return results
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "Function import failed", cause: error })))
  )
}

/**
 * Execute a V2 function import that returns a primitive value.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeFunctionImportPrimitive = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionName: string,
  propertyName: string,
  schema: Schema.Schema<A, I, R>,
  parameters?: OperationParameters,
  options?: FunctionImportOptions
): Effect.Effect<A, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${buildFunctionImportUrl(functionName, parameters)}`
  const method = options?.method ?? "GET"
  const responseSchema = Schema.Struct({
    d: Schema.Struct({
      [propertyName]: schema
    })
  })

  return Effect.gen(function*() {
    const request = method === "GET"
      ? HttpClientRequest.get(url)
      : HttpClientRequest.post(url)

    const configuredRequest = request.pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(configuredRequest)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return (data.d as Record<string, A>)[propertyName]
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "Function import failed", cause: error })))
  )
}

// ============================================================================
// V4 Functions and Actions
// ============================================================================

/**
 * Format a V4 parameter for URL.
 * Strings are URL-encoded for safe transmission.
 *
 * @since 1.0.0
 * @category utils
 */
const formatV4Parameter = (key: string, value: NonNullable<OperationParameters[string]>): string => {
  if (typeof value === "string") {
    // URL-encode string values for query parameters
    return `${key}='${encodeUrlValue(value)}'`
  }
  return `${key}=${formatV4UrlValue(value)}`
}

/**
 * Build a V4 function URL with parameters.
 * V4 functions use parentheses for parameters: Function(param1=value1,param2=value2)
 *
 * @since 1.0.0
 * @category utils
 */
export const buildV4FunctionUrl = (
  functionName: string,
  parameters?: OperationParameters
): string => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return `${functionName}()`
  }

  const params = Object.entries(parameters)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (value === null) {
        return `${key}=null`
      }
      return formatV4Parameter(key, value!)
    })
    .join(",")

  return `${functionName}(${params})`
}

/**
 * Build a V4 bound function/action URL.
 *
 * @since 1.0.0
 * @category utils
 */
export const buildV4BoundOperationUrl = (
  entityPath: string,
  namespace: string,
  operationName: string,
  parameters?: OperationParameters
): string => {
  const qualifiedName = `${namespace}.${operationName}`
  if (!parameters || Object.keys(parameters).length === 0) {
    return `${entityPath}/${qualifiedName}()`
  }

  const params = Object.entries(parameters)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (value === null) {
        return `${key}=null`
      }
      return formatV4Parameter(key, value!)
    })
    .join(",")

  return `${entityPath}/${qualifiedName}(${params})`
}

/**
 * Execute a V4 function (GET, no side effects) that returns void.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4FunctionVoid = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionUrl: string
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${functionUrl}`

  return Effect.gen(function*() {
    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 function failed", cause: error })))
  )
}

/**
 * Execute a V4 function that returns a single entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4FunctionEntity = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionUrl: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<A, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${functionUrl}`

  return Effect.gen(function*() {
    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
    // V4 returns entity directly
    const data = yield* HttpClientResponse.schemaBodyJson(schema)(response)
    return data
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 function failed", cause: error })))
  )
}

/**
 * Execute a V4 function that returns a collection.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4FunctionCollection = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionUrl: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<ReadonlyArray<A>, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${functionUrl}`
  const responseSchema = ODataV4CollectionResponse(schema)

  return Effect.gen(function*() {
    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.value
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 function failed", cause: error })))
  )
}

/**
 * Execute a V4 function that returns a primitive value.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4FunctionPrimitive = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  functionUrl: string,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<A, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${functionUrl}`
  const responseSchema = ODataV4ValueResponse(schema)

  return Effect.gen(function*() {
    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.value
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 function failed", cause: error })))
  )
}

/**
 * Execute a V4 action (POST, may have side effects) that returns void.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4ActionVoid = <B, BI>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  actionUrl: string,
  body?: B,
  bodySchema?: Schema.Schema<B, BI>
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${actionUrl}`

  return Effect.gen(function*() {
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (body && bodySchema) {
      request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(request, body)
    }

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 action failed", cause: error })))
  )
}

/**
 * Execute a V4 action that returns a single entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4ActionEntity = <A, I, R, B, BI>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  actionUrl: string,
  responseSchema: Schema.Schema<A, I, R>,
  body?: B,
  bodySchema?: Schema.Schema<B, BI>
): Effect.Effect<A, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${actionUrl}`

  return Effect.gen(function*() {
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (body && bodySchema) {
      request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(request, body)
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 action failed", cause: error })))
  )
}

/**
 * Execute a V4 action that returns a collection.
 *
 * @since 1.0.0
 * @category operations
 */
export const executeV4ActionCollection = <A, I, R, B, BI>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  actionUrl: string,
  schema: Schema.Schema<A, I, R>,
  body?: B,
  bodySchema?: Schema.Schema<B, BI>
): Effect.Effect<ReadonlyArray<A>, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${actionUrl}`
  const responseSchema = ODataV4CollectionResponse(schema)

  return Effect.gen(function*() {
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (body && bodySchema) {
      request = yield* HttpClientRequest.schemaBodyJson(bodySchema)(request, body)
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
    const data = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
    return data.value
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) => Effect.fail(new ODataError({ message: "V4 action failed", cause: error })))
  )
}

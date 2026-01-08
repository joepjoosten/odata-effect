/**
 * OData Batch Request Support.
 *
 * Supports OData $batch operations for executing multiple requests in a single HTTP call.
 * - V2: Multipart/mixed format only
 * - V4: Multipart/mixed or JSON format
 *
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  type HttpClientError
} from "@effect/platform"
import { ODataError, ParseError } from "./Errors.js"
import type { ODataClientConfigService } from "./ODataClient.js"
import type { ODataV4ClientConfigService } from "./ODataV4Client.js"

// ============================================================================
// Batch Request Types
// ============================================================================

/**
 * HTTP method for batch operations.
 *
 * @since 1.0.0
 * @category models
 */
export type BatchHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "MERGE"

/**
 * A single request within a batch.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchRequest {
  /** Unique identifier for this request within the batch */
  readonly id: string
  /** HTTP method */
  readonly method: BatchHttpMethod
  /** Request URL (relative to service root) */
  readonly url: string
  /** Optional request headers */
  readonly headers: Record<string, string> | undefined
  /** Optional request body (for POST/PUT/PATCH/MERGE) */
  readonly body: unknown | undefined
}

/**
 * A changeset groups multiple operations that should be executed atomically.
 * If any operation fails, all operations in the changeset are rolled back.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchChangeset {
  readonly type: "changeset"
  /** Unique identifier for this changeset */
  readonly id: string
  /** Requests within this changeset (must be CUD operations, not GET) */
  readonly requests: ReadonlyArray<BatchRequest>
}

/**
 * A batch can contain individual GET requests or changesets.
 *
 * @since 1.0.0
 * @category models
 */
export type BatchOperation = BatchRequest | BatchChangeset

/**
 * Response for a single request within a batch.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchResponse {
  /** The request ID this response corresponds to */
  readonly id: string
  /** HTTP status code */
  readonly status: number
  /** HTTP status text */
  readonly statusText: string
  /** Response headers */
  readonly headers: Record<string, string>
  /** Response body (parsed JSON or raw text) */
  readonly body: unknown
}

/**
 * Response for a changeset within a batch.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchChangesetResponse {
  readonly type: "changeset"
  /** The changeset ID this response corresponds to */
  readonly id: string
  /** Whether all operations in the changeset succeeded */
  readonly success: boolean
  /** Individual responses for requests in the changeset */
  readonly responses: ReadonlyArray<BatchResponse>
}

/**
 * Combined batch response type.
 *
 * @since 1.0.0
 * @category models
 */
export type BatchOperationResponse = BatchResponse | BatchChangesetResponse

// ============================================================================
// Batch Request Builder
// ============================================================================

/**
 * Builder for constructing batch requests.
 *
 * @since 1.0.0
 * @category models
 */
export class BatchBuilder {
  private readonly operations: Array<BatchOperation> = []
  private requestCounter = 0
  private changesetCounter = 0

  /**
   * Add a GET request to the batch.
   */
  get(url: string, headers?: Record<string, string>): this {
    this.operations.push({
      id: `request_${++this.requestCounter}`,
      method: "GET",
      url,
      headers,
      body: undefined
    })
    return this
  }

  /**
   * Add a POST request to the batch (will be wrapped in a changeset).
   */
  post(url: string, body: unknown, headers?: Record<string, string>): this {
    this.addToChangeset({
      id: `request_${++this.requestCounter}`,
      method: "POST",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a PATCH request to the batch (will be wrapped in a changeset).
   */
  patch(url: string, body: unknown, headers?: Record<string, string>): this {
    this.addToChangeset({
      id: `request_${++this.requestCounter}`,
      method: "PATCH",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a MERGE request to the batch (V2, will be wrapped in a changeset).
   */
  merge(url: string, body: unknown, headers?: Record<string, string>): this {
    this.addToChangeset({
      id: `request_${++this.requestCounter}`,
      method: "MERGE",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a PUT request to the batch (will be wrapped in a changeset).
   */
  put(url: string, body: unknown, headers?: Record<string, string>): this {
    this.addToChangeset({
      id: `request_${++this.requestCounter}`,
      method: "PUT",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a DELETE request to the batch (will be wrapped in a changeset).
   */
  delete(url: string, headers?: Record<string, string>): this {
    this.addToChangeset({
      id: `request_${++this.requestCounter}`,
      method: "DELETE",
      url,
      headers,
      body: undefined
    })
    return this
  }

  /**
   * Start a new changeset for grouping atomic operations.
   */
  beginChangeset(): ChangesetBuilder {
    return new ChangesetBuilder(this, `changeset_${++this.changesetCounter}`)
  }

  /**
   * Add a raw request to the batch.
   */
  addRequest(request: BatchRequest): this {
    this.operations.push(request)
    return this
  }

  /**
   * Add a changeset to the batch.
   */
  addChangeset(changeset: BatchChangeset): this {
    this.operations.push(changeset)
    return this
  }

  /**
   * Get all operations in this batch.
   */
  getOperations(): ReadonlyArray<BatchOperation> {
    return this.operations
  }

  /**
   * Build the batch operations.
   */
  build(): ReadonlyArray<BatchOperation> {
    return this.operations
  }

  private addToChangeset(request: BatchRequest): void {
    // Find the last changeset or create a new one
    const lastOp = this.operations[this.operations.length - 1]
    if (lastOp && "type" in lastOp && lastOp.type === "changeset") {
      // Add to existing changeset
      const changeset = lastOp as BatchChangeset
      this.operations[this.operations.length - 1] = {
        ...changeset,
        requests: [...changeset.requests, request]
      }
    } else {
      // Create new changeset
      this.operations.push({
        type: "changeset",
        id: `changeset_${++this.changesetCounter}`,
        requests: [request]
      })
    }
  }
}

/**
 * Builder for constructing changesets within a batch.
 *
 * @since 1.0.0
 * @category models
 */
export class ChangesetBuilder {
  private readonly requests: Array<BatchRequest> = []
  private requestCounter = 0

  constructor(
    private readonly parent: BatchBuilder,
    private readonly changesetId: string
  ) {}

  /**
   * Add a POST request to the changeset.
   */
  post(url: string, body: unknown, headers?: Record<string, string>): this {
    this.requests.push({
      id: `${this.changesetId}_request_${++this.requestCounter}`,
      method: "POST",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a PATCH request to the changeset.
   */
  patch(url: string, body: unknown, headers?: Record<string, string>): this {
    this.requests.push({
      id: `${this.changesetId}_request_${++this.requestCounter}`,
      method: "PATCH",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a MERGE request to the changeset (V2).
   */
  merge(url: string, body: unknown, headers?: Record<string, string>): this {
    this.requests.push({
      id: `${this.changesetId}_request_${++this.requestCounter}`,
      method: "MERGE",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a PUT request to the changeset.
   */
  put(url: string, body: unknown, headers?: Record<string, string>): this {
    this.requests.push({
      id: `${this.changesetId}_request_${++this.requestCounter}`,
      method: "PUT",
      url,
      headers,
      body
    })
    return this
  }

  /**
   * Add a DELETE request to the changeset.
   */
  delete(url: string, headers?: Record<string, string>): this {
    this.requests.push({
      id: `${this.changesetId}_request_${++this.requestCounter}`,
      method: "DELETE",
      url,
      headers,
      body: undefined
    })
    return this
  }

  /**
   * End the changeset and return to the batch builder.
   */
  endChangeset(): BatchBuilder {
    this.parent.addChangeset({
      type: "changeset",
      id: this.changesetId,
      requests: this.requests
    })
    return this.parent
  }
}

/**
 * Create a new batch request builder.
 *
 * @since 1.0.0
 * @category constructors
 */
export const createBatchBuilder = (): BatchBuilder => new BatchBuilder()

// ============================================================================
// V2 Batch Serialization (Multipart/Mixed)
// ============================================================================

/**
 * Generate a unique boundary string for multipart messages.
 *
 * @since 1.0.0
 * @category utils
 */
export const generateBoundary = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

/**
 * Serialize a batch request to V2 multipart/mixed format.
 *
 * @since 1.0.0
 * @category serialization
 */
export const serializeBatchV2 = (
  operations: ReadonlyArray<BatchOperation>,
  servicePath: string
): { body: string; boundary: string } => {
  const batchBoundary = generateBoundary("batch")
  const parts: string[] = []

  for (const op of operations) {
    if ("type" in op && op.type === "changeset") {
      // Serialize changeset
      const changesetBoundary = generateBoundary("changeset")
      const changesetParts: string[] = []

      for (const request of op.requests) {
        changesetParts.push(serializeRequestV2(request, servicePath))
      }

      const changesetBody = changesetParts
        .map((p) => `--${changesetBoundary}\r\n${p}`)
        .join("\r\n")

      parts.push(
        `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n` +
          changesetBody +
          `\r\n--${changesetBoundary}--`
      )
    } else {
      // Serialize individual request
      parts.push(serializeRequestV2(op as BatchRequest, servicePath))
    }
  }

  const body = parts.map((p) => `--${batchBoundary}\r\n${p}`).join("\r\n") + `\r\n--${batchBoundary}--`

  return { body, boundary: batchBoundary }
}

const serializeRequestV2 = (request: BatchRequest, servicePath: string): string => {
  const lines: string[] = []

  lines.push("Content-Type: application/http")
  lines.push("Content-Transfer-Encoding: binary")
  lines.push("")

  // HTTP request line
  const url = request.url.startsWith("/") ? request.url : `${servicePath}${request.url}`
  lines.push(`${request.method} ${url} HTTP/1.1`)

  // Headers
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...request.headers
  }

  if (request.body) {
    headers["Content-Type"] = "application/json"
  }

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${key}: ${value}`)
  }

  lines.push("")

  // Body
  if (request.body) {
    lines.push(JSON.stringify(request.body))
  }

  return lines.join("\r\n")
}

// ============================================================================
// V4 Batch Serialization (JSON format)
// ============================================================================

/**
 * V4 JSON batch request format.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchRequestV4Json {
  readonly requests: ReadonlyArray<BatchRequestItemV4>
}

/**
 * V4 JSON batch request item.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchRequestItemV4 {
  readonly id: string
  readonly method: BatchHttpMethod
  readonly url: string
  readonly headers: Record<string, string> | undefined
  readonly body: unknown | undefined
  /** For atomicity group (changeset equivalent) */
  readonly atomicityGroup: string | undefined
  /** For referencing results of previous requests */
  readonly dependsOn: ReadonlyArray<string> | undefined
}

/**
 * Serialize a batch request to V4 JSON format.
 *
 * @since 1.0.0
 * @category serialization
 */
export const serializeBatchV4Json = (
  operations: ReadonlyArray<BatchOperation>
): BatchRequestV4Json => {
  const requests: BatchRequestItemV4[] = []

  for (const op of operations) {
    if ("type" in op && op.type === "changeset") {
      // Map changeset to atomicity group
      for (const request of op.requests) {
        requests.push({
          id: request.id,
          method: request.method,
          url: request.url,
          headers: request.headers ?? undefined,
          body: request.body ?? undefined,
          atomicityGroup: op.id,
          dependsOn: undefined
        })
      }
    } else {
      const request = op as BatchRequest
      requests.push({
        id: request.id,
        method: request.method,
        url: request.url,
        headers: request.headers ?? undefined,
        body: request.body ?? undefined,
        atomicityGroup: undefined,
        dependsOn: undefined
      })
    }
  }

  return { requests }
}

// ============================================================================
// V2 Batch Response Parsing
// ============================================================================

/**
 * Parse a V2 multipart/mixed batch response.
 *
 * @since 1.0.0
 * @category parsing
 */
export const parseBatchResponseV2 = (
  responseText: string,
  boundary: string
): ReadonlyArray<BatchOperationResponse> => {
  const results: BatchOperationResponse[] = []
  const parts = responseText.split(`--${boundary}`)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed === "--") continue

    // Check if this is a changeset
    const changesetMatch = trimmed.match(/Content-Type:\s*multipart\/mixed;\s*boundary=([^\s\r\n]+)/i)
    if (changesetMatch) {
      const changesetBoundary = changesetMatch[1]
      const changesetResponses = parseChangesetResponse(trimmed, changesetBoundary)
      if (changesetResponses.length > 0) {
        results.push({
          type: "changeset",
          id: changesetBoundary,
          success: changesetResponses.every((r) => r.status >= 200 && r.status < 300),
          responses: changesetResponses
        })
      }
    } else {
      // Individual response
      const response = parseIndividualResponse(trimmed)
      if (response) {
        results.push(response)
      }
    }
  }

  return results
}

const parseChangesetResponse = (
  changesetText: string,
  boundary: string
): ReadonlyArray<BatchResponse> => {
  const results: BatchResponse[] = []
  const parts = changesetText.split(`--${boundary}`)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed || trimmed === "--") continue

    const response = parseIndividualResponse(trimmed)
    if (response) {
      results.push(response)
    }
  }

  return results
}

const parseIndividualResponse = (responseText: string): BatchResponse | null => {
  // Find the HTTP response line
  const httpMatch = responseText.match(/HTTP\/1\.1\s+(\d+)\s+([^\r\n]+)/)
  if (!httpMatch) return null

  const status = parseInt(httpMatch[1], 10)
  const statusText = httpMatch[2]

  // Parse headers
  const headers: Record<string, string> = {}
  const headerSection = responseText.substring(
    responseText.indexOf(httpMatch[0]) + httpMatch[0].length
  )
  const headerEndIndex = headerSection.indexOf("\r\n\r\n")
  const headerLines =
    headerEndIndex > -1 ? headerSection.substring(0, headerEndIndex).split("\r\n") : []

  for (const line of headerLines) {
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      headers[key.toLowerCase()] = value
    }
  }

  // Parse body
  let body: unknown = null
  const bodyStartIndex = responseText.indexOf("\r\n\r\n", responseText.indexOf(httpMatch[0]))
  if (bodyStartIndex > -1) {
    const bodyText = responseText.substring(bodyStartIndex + 4).trim()
    if (bodyText) {
      try {
        body = JSON.parse(bodyText)
      } catch {
        body = bodyText
      }
    }
  }

  // Generate an ID from content-id header or position
  const contentIdMatch = responseText.match(/Content-ID:\s*<?([^>\r\n]+)>?/i)
  const id = contentIdMatch ? contentIdMatch[1] : `response_${Date.now()}`

  return { id, status, statusText, headers, body }
}

// ============================================================================
// V4 Batch Response Parsing (JSON format)
// ============================================================================

/**
 * V4 JSON batch response format.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchResponseV4Json {
  readonly responses: ReadonlyArray<BatchResponseItemV4>
}

/**
 * V4 JSON batch response item.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchResponseItemV4 {
  readonly id: string
  readonly status: number
  readonly headers: Record<string, string> | undefined
  readonly body: unknown | undefined
  readonly atomicityGroup: string | undefined
}

/**
 * Schema for V4 JSON batch response.
 *
 * @since 1.0.0
 * @category schemas
 */
export const BatchResponseV4JsonSchema = Schema.Struct({
  responses: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      status: Schema.Number,
      headers: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
      body: Schema.optional(Schema.Unknown),
      atomicityGroup: Schema.optional(Schema.String)
    })
  )
})

/**
 * Type for the schema-parsed V4 response.
 */
type BatchResponseV4JsonSchemaType = typeof BatchResponseV4JsonSchema.Type

/**
 * Parse a V4 JSON batch response from schema-decoded data.
 *
 * @internal
 */
const parseBatchResponseV4JsonFromSchema = (
  response: BatchResponseV4JsonSchemaType
): ReadonlyArray<BatchOperationResponse> => {
  const results: BatchOperationResponse[] = []
  const atomicityGroups = new Map<string, BatchResponse[]>()

  for (const item of response.responses) {
    const batchResponse: BatchResponse = {
      id: item.id,
      status: item.status,
      statusText: getStatusText(item.status),
      headers: item.headers ?? {},
      body: item.body
    }

    if (item.atomicityGroup) {
      const group = atomicityGroups.get(item.atomicityGroup) ?? []
      group.push(batchResponse)
      atomicityGroups.set(item.atomicityGroup, group)
    } else {
      results.push(batchResponse)
    }
  }

  // Convert atomicity groups to changeset responses
  for (const [groupId, responses] of atomicityGroups) {
    results.push({
      type: "changeset",
      id: groupId,
      success: responses.every((r) => r.status >= 200 && r.status < 300),
      responses
    })
  }

  return results
}

/**
 * Parse a V4 JSON batch response.
 *
 * @since 1.0.0
 * @category parsing
 */
export const parseBatchResponseV4Json = (
  response: BatchResponseV4Json
): ReadonlyArray<BatchOperationResponse> => {
  const results: BatchOperationResponse[] = []
  const atomicityGroups = new Map<string, BatchResponse[]>()

  for (const item of response.responses) {
    const batchResponse: BatchResponse = {
      id: item.id,
      status: item.status,
      statusText: getStatusText(item.status),
      headers: item.headers ?? {},
      body: item.body
    }

    if (item.atomicityGroup) {
      const group = atomicityGroups.get(item.atomicityGroup) ?? []
      group.push(batchResponse)
      atomicityGroups.set(item.atomicityGroup, group)
    } else {
      results.push(batchResponse)
    }
  }

  // Convert atomicity groups to changeset responses
  for (const [groupId, responses] of atomicityGroups) {
    results.push({
      type: "changeset",
      id: groupId,
      success: responses.every((r) => r.status >= 200 && r.status < 300),
      responses
    })
  }

  return results
}

const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error"
  }
  return statusTexts[status] ?? "Unknown"
}

// ============================================================================
// Batch Execution
// ============================================================================

/**
 * Options for batch execution.
 *
 * @since 1.0.0
 * @category models
 */
export interface BatchExecutionOptions {
  /** Continue processing on error (V4 only) */
  readonly continueOnError: boolean | undefined
}

/**
 * Execute a V2 batch request.
 *
 * @since 1.0.0
 * @category execution
 */
export const executeBatchV2 = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  operations: ReadonlyArray<BatchOperation>
): Effect.Effect<
  ReadonlyArray<BatchOperationResponse>,
  HttpClientError.HttpClientError | ParseError | ODataError,
  never
> => {
  const { body, boundary } = serializeBatchV2(operations, config.servicePath)
  const url = `${config.baseUrl}${config.servicePath}$batch`

  return Effect.gen(function* () {
    const request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Content-Type", `multipart/mixed; boundary=${boundary}`),
      HttpClientRequest.setHeader("Accept", "multipart/mixed"),
      HttpClientRequest.bodyText(body)
    )

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const responseText = yield* response.text

    // Extract boundary from response content-type
    const contentType = response.headers["content-type"] ?? ""
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/)
    const responseBoundary = boundaryMatch ? boundaryMatch[1] : boundary

    return parseBatchResponseV2(responseText, responseBoundary)
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Batch request failed", cause: error }))
    )
  )
}

/**
 * Execute a V4 batch request using JSON format.
 *
 * @since 1.0.0
 * @category execution
 */
export const executeBatchV4Json = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  operations: ReadonlyArray<BatchOperation>,
  options?: BatchExecutionOptions
): Effect.Effect<
  ReadonlyArray<BatchOperationResponse>,
  HttpClientError.HttpClientError | ParseError | ODataError,
  never
> => {
  const batchRequest = serializeBatchV4Json(operations)
  const url = `${config.baseUrl}${config.servicePath}$batch`

  return Effect.gen(function* () {
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (options?.continueOnError) {
      request = request.pipe(HttpClientRequest.setHeader("Prefer", "odata.continue-on-error"))
    }

    request = request.pipe(HttpClientRequest.bodyUnsafeJson(batchRequest))

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const data = yield* HttpClientResponse.schemaBodyJson(BatchResponseV4JsonSchema)(response)
    // Parse the typed schema result into our interface
    return parseBatchResponseV4JsonFromSchema(data)
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 batch request failed", cause: error }))
    )
  )
}

/**
 * Execute a V4 batch request using multipart format.
 *
 * @since 1.0.0
 * @category execution
 */
export const executeBatchV4Multipart = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  operations: ReadonlyArray<BatchOperation>,
  options?: BatchExecutionOptions
): Effect.Effect<
  ReadonlyArray<BatchOperationResponse>,
  HttpClientError.HttpClientError | ParseError | ODataError,
  never
> => {
  const { body, boundary } = serializeBatchV2(operations, config.servicePath)
  const url = `${config.baseUrl}${config.servicePath}$batch`

  return Effect.gen(function* () {
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Content-Type", `multipart/mixed; boundary=${boundary}`),
      HttpClientRequest.setHeader("Accept", "multipart/mixed"),
      HttpClientRequest.setHeader("OData-Version", "4.0"),
      HttpClientRequest.bodyText(body)
    )

    if (options?.continueOnError) {
      request = request.pipe(HttpClientRequest.setHeader("Prefer", "odata.continue-on-error"))
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const responseText = yield* response.text

    // Extract boundary from response content-type
    const contentType = response.headers["content-type"] ?? ""
    const boundaryMatch = contentType.match(/boundary=([^\s;]+)/)
    const responseBoundary = boundaryMatch ? boundaryMatch[1] : boundary

    return parseBatchResponseV2(responseText, responseBoundary)
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 batch request failed", cause: error }))
    )
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a response by request ID.
 *
 * @since 1.0.0
 * @category utils
 */
export const findResponseById = (
  responses: ReadonlyArray<BatchOperationResponse>,
  requestId: string
): BatchResponse | undefined => {
  for (const response of responses) {
    if ("type" in response && response.type === "changeset") {
      const found = response.responses.find((r) => r.id === requestId)
      if (found) return found
    } else if ((response as BatchResponse).id === requestId) {
      return response as BatchResponse
    }
  }
  return undefined
}

/**
 * Check if all responses in a batch were successful.
 *
 * @since 1.0.0
 * @category utils
 */
export const isBatchSuccessful = (responses: ReadonlyArray<BatchOperationResponse>): boolean => {
  for (const response of responses) {
    if ("type" in response && response.type === "changeset") {
      if (!response.success) return false
    } else {
      const r = response as BatchResponse
      if (r.status < 200 || r.status >= 300) return false
    }
  }
  return true
}

/**
 * Get all failed responses from a batch.
 *
 * @since 1.0.0
 * @category utils
 */
export const getFailedResponses = (
  responses: ReadonlyArray<BatchOperationResponse>
): ReadonlyArray<BatchResponse> => {
  const failed: BatchResponse[] = []

  for (const response of responses) {
    if ("type" in response && response.type === "changeset") {
      failed.push(...response.responses.filter((r) => r.status < 200 || r.status >= 300))
    } else {
      const r = response as BatchResponse
      if (r.status < 200 || r.status >= 300) {
        failed.push(r)
      }
    }
  }

  return failed
}

/**
 * Type-safe extraction of response body.
 *
 * @since 1.0.0
 * @category utils
 */
export const extractResponseBody = <A, I, R>(
  response: BatchResponse,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<A, ParseError, R> =>
  Schema.decodeUnknown(schema)(response.body).pipe(
    Effect.mapError(
      (error) => new ParseError({ message: "Failed to parse batch response body", cause: error })
    )
  )

/**
 * Type-safe extraction of V2 response body (unwraps { d: ... }).
 *
 * @since 1.0.0
 * @category utils
 */
export const extractResponseBodyV2 = <A, I, R>(
  response: BatchResponse,
  schema: Schema.Schema<A, I, R>
): Effect.Effect<A, ParseError, R> => {
  const wrappedSchema = Schema.Struct({ d: schema })
  return Schema.decodeUnknown(wrappedSchema)(response.body).pipe(
    Effect.map((data) => data.d),
    Effect.mapError(
      (error) => new ParseError({ message: "Failed to parse V2 batch response body", cause: error })
    )
  )
}

/**
 * OData Media Entity Support.
 *
 * Provides functionality for working with OData media entities (binary content).
 * Supports both V2 and V4 media handling.
 *
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
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
// Media Types
// ============================================================================

/**
 * Supported media content types.
 *
 * @since 1.0.0
 * @category models
 */
export type MediaContentType =
  | "application/octet-stream"
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "text/plain"
  | "text/csv"
  | "application/json"
  | "application/xml"
  | (string & {})

/**
 * Options for media download operations.
 *
 * @since 1.0.0
 * @category models
 */
export interface MediaDownloadOptions {
  /** Expected content type (for validation) */
  readonly contentType: MediaContentType | undefined
  /** Custom headers to include */
  readonly headers: Record<string, string> | undefined
}

/**
 * Options for media upload operations.
 *
 * @since 1.0.0
 * @category models
 */
export interface MediaUploadOptions {
  /** Content type of the uploaded media */
  readonly contentType: MediaContentType
  /** Custom headers to include */
  readonly headers: Record<string, string> | undefined
  /** Slug header for filename (V2) */
  readonly slug: string | undefined
  /** Content-ID for batch operations */
  readonly contentId: string | undefined
}

/**
 * Result of a media download operation.
 *
 * @since 1.0.0
 * @category models
 */
export interface MediaDownloadResult {
  /** The binary content as Uint8Array */
  readonly data: Uint8Array
  /** Content type from response */
  readonly contentType: string
  /** Content length if available */
  readonly contentLength: number | undefined
  /** ETag for concurrency control */
  readonly etag: string | undefined
}

/**
 * Result of a media download as stream.
 *
 * @since 1.0.0
 * @category models
 */
export interface MediaStreamResult {
  /** The binary content as a Stream */
  readonly stream: Stream.Stream<Uint8Array, HttpClientError.HttpClientError>
  /** Content type from response */
  readonly contentType: string
  /** Content length if available */
  readonly contentLength: number | undefined
  /** ETag for concurrency control */
  readonly etag: string | undefined
}

// ============================================================================
// V2 Media Operations
// ============================================================================

/**
 * Download media content from an OData V2 entity.
 *
 * @since 1.0.0
 * @category operations
 * @example
 * ```ts
 * const result = yield* getMediaV2(client, config, "Attachments('123')/$value")
 * console.log(result.contentType, result.data.length)
 * ```
 */
export const getMediaV2 = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  path: string,
  options?: MediaDownloadOptions
): Effect.Effect<MediaDownloadResult, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", options?.contentType ?? "*/*")
    )

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const data = yield* response.arrayBuffer.pipe(
      Effect.map((buffer) => new Uint8Array(buffer))
    )

    const contentType = response.headers["content-type"] ?? "application/octet-stream"
    const contentLengthHeader = response.headers["content-length"]
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined
    const etag = response.headers["etag"]

    return {
      data,
      contentType,
      contentLength,
      etag
    }
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Media download failed", cause: error }))
    )
  )
}

/**
 * Download media content as a stream from an OData V2 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const getMediaStreamV2 = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  path: string,
  options?: MediaDownloadOptions
): Effect.Effect<MediaStreamResult, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", options?.contentType ?? "*/*")
    )

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const contentType = response.headers["content-type"] ?? "application/octet-stream"
    const contentLengthHeader = response.headers["content-length"]
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined
    const etag = response.headers["etag"]

    return {
      stream: response.stream,
      contentType,
      contentLength,
      etag
    }
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Media stream failed", cause: error }))
    )
  )
}

/**
 * Upload media content to an OData V2 entity.
 *
 * @since 1.0.0
 * @category operations
 * @example
 * ```ts
 * const result = yield* uploadMediaV2(
 *   client,
 *   config,
 *   "Attachments",
 *   new Uint8Array([...]),
 *   { contentType: "application/pdf", slug: "document.pdf" }
 * )
 * ```
 */
export const uploadMediaV2 = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  path: string,
  data: Uint8Array,
  options: MediaUploadOptions,
  responseSchema?: Schema.Schema<A, I, R>
): Effect.Effect<A | void, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    // Set Content-Type AFTER bodyUint8Array since it sets a default Content-Type
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.bodyUint8Array(data),
      HttpClientRequest.setHeader("Content-Type", options.contentType)
    )

    if (options.slug) {
      request = request.pipe(HttpClientRequest.setHeader("Slug", options.slug))
    }

    if (options.contentId) {
      request = request.pipe(HttpClientRequest.setHeader("Content-ID", options.contentId))
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    if (responseSchema) {
      const wrappedSchema = Schema.Struct({ d: responseSchema })
      const result = yield* HttpClientResponse.schemaBodyJson(wrappedSchema)(response)
      return result.d
    }

    return undefined as void
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Media upload failed", cause: error }))
    )
  )
}

/**
 * Update media content of an existing OData V2 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const updateMediaV2 = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  path: string,
  data: Uint8Array,
  options: MediaUploadOptions & { readonly etag?: string }
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    // Set Content-Type AFTER bodyUint8Array since it sets a default Content-Type
    let request = HttpClientRequest.put(url).pipe(
      HttpClientRequest.bodyUint8Array(data),
      HttpClientRequest.setHeader("Content-Type", options.contentType)
    )

    if (options.etag) {
      request = request.pipe(HttpClientRequest.setHeader("If-Match", options.etag))
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Media update failed", cause: error }))
    )
  )
}

/**
 * Delete media content from an OData V2 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const deleteMediaV2 = (
  client: HttpClient.HttpClient,
  config: ODataClientConfigService,
  path: string,
  etag?: string
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.del(url)

    if (etag) {
      request = request.pipe(HttpClientRequest.setHeader("If-Match", etag))
    }

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "Media delete failed", cause: error }))
    )
  )
}

// ============================================================================
// V4 Media Operations
// ============================================================================

/**
 * Download media content from an OData V4 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const getMediaV4 = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  path: string,
  options?: MediaDownloadOptions
): Effect.Effect<MediaDownloadResult, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", options?.contentType ?? "*/*"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const data = yield* response.arrayBuffer.pipe(
      Effect.map((buffer) => new Uint8Array(buffer))
    )

    const contentType = response.headers["content-type"] ?? "application/octet-stream"
    const contentLengthHeader = response.headers["content-length"]
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined
    const etag = response.headers["etag"]

    return {
      data,
      contentType,
      contentLength,
      etag
    }
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 media download failed", cause: error }))
    )
  )
}

/**
 * Download media content as a stream from an OData V4 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const getMediaStreamV4 = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  path: string,
  options?: MediaDownloadOptions
): Effect.Effect<MediaStreamResult, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.setHeader("Accept", options?.contentType ?? "*/*"),
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (options?.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    const contentType = response.headers["content-type"] ?? "application/octet-stream"
    const contentLengthHeader = response.headers["content-length"]
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined
    const etag = response.headers["etag"]

    return {
      stream: response.stream,
      contentType,
      contentLength,
      etag
    }
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 media stream failed", cause: error }))
    )
  )
}

/**
 * Upload media content to an OData V4 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const uploadMediaV4 = <A, I, R>(
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  path: string,
  data: Uint8Array,
  options: MediaUploadOptions,
  responseSchema?: Schema.Schema<A, I, R>
): Effect.Effect<A | void, HttpClientError.HttpClientError | ParseError | ODataError, R> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    // Set Content-Type AFTER bodyUint8Array since it sets a default Content-Type
    let request = HttpClientRequest.post(url).pipe(
      HttpClientRequest.setHeader("Accept", "application/json"),
      HttpClientRequest.setHeader("OData-Version", "4.0"),
      HttpClientRequest.bodyUint8Array(data),
      HttpClientRequest.setHeader("Content-Type", options.contentType)
    )

    if (options.slug) {
      request = request.pipe(HttpClientRequest.setHeader("Content-Disposition", `attachment; filename="${options.slug}"`))
    }

    if (options.contentId) {
      request = request.pipe(HttpClientRequest.setHeader("Content-ID", options.contentId))
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    const response = yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )

    if (responseSchema) {
      const result = yield* HttpClientResponse.schemaBodyJson(responseSchema)(response)
      return result
    }

    return undefined as void
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 media upload failed", cause: error }))
    )
  )
}

/**
 * Update media content of an existing OData V4 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const updateMediaV4 = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  path: string,
  data: Uint8Array,
  options: MediaUploadOptions & { readonly etag?: string }
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    // Set Content-Type AFTER bodyUint8Array since it sets a default Content-Type
    let request = HttpClientRequest.put(url).pipe(
      HttpClientRequest.setHeader("OData-Version", "4.0"),
      HttpClientRequest.bodyUint8Array(data),
      HttpClientRequest.setHeader("Content-Type", options.contentType)
    )

    if (options.etag) {
      request = request.pipe(HttpClientRequest.setHeader("If-Match", options.etag))
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        request = request.pipe(HttpClientRequest.setHeader(key, value))
      }
    }

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 media update failed", cause: error }))
    )
  )
}

/**
 * Delete media content from an OData V4 entity.
 *
 * @since 1.0.0
 * @category operations
 */
export const deleteMediaV4 = (
  client: HttpClient.HttpClient,
  config: ODataV4ClientConfigService,
  path: string,
  etag?: string
): Effect.Effect<void, HttpClientError.HttpClientError | ODataError, never> => {
  const url = `${config.baseUrl}${config.servicePath}${path}`

  return Effect.gen(function* () {
    let request = HttpClientRequest.del(url).pipe(
      HttpClientRequest.setHeader("OData-Version", "4.0")
    )

    if (etag) {
      request = request.pipe(HttpClientRequest.setHeader("If-Match", etag))
    }

    yield* client.pipe(
      HttpClient.filterStatusOk,
      (c) => c.execute(request)
    )
  }).pipe(
    Effect.scoped,
    Effect.catchAll((error) =>
      Effect.fail(new ODataError({ message: "V4 media delete failed", cause: error }))
    )
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a media value path ($value suffix).
 *
 * @since 1.0.0
 * @category utils
 */
export const buildMediaValuePath = (entityPath: string): string =>
  entityPath.endsWith("/$value") ? entityPath : `${entityPath}/$value`

/**
 * Build a media property path for a specific property.
 *
 * @since 1.0.0
 * @category utils
 */
export const buildMediaPropertyPath = (entityPath: string, propertyName: string): string =>
  `${entityPath}/${propertyName}/$value`

/**
 * Check if a content type is binary.
 *
 * @since 1.0.0
 * @category utils
 */
export const isBinaryContentType = (contentType: string): boolean => {
  const binaryTypes = [
    "application/octet-stream",
    "application/pdf",
    "application/zip",
    "application/gzip",
    "application/x-tar",
    "image/",
    "audio/",
    "video/",
    "application/vnd.ms-",
    "application/vnd.openxmlformats-"
  ]
  return binaryTypes.some((type) => contentType.startsWith(type) || contentType.includes(type))
}

/**
 * Get file extension from content type.
 *
 * @since 1.0.0
 * @category utils
 */
export const getExtensionFromContentType = (contentType: string): string | undefined => {
  const extensionMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/json": "json",
    "application/xml": "xml",
    "text/plain": "txt",
    "text/csv": "csv",
    "text/html": "html",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "application/zip": "zip",
    "application/gzip": "gz",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-word": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
  }
  return extensionMap[contentType.split(";")[0].trim()]
}

/**
 * Get content type from file extension.
 *
 * @since 1.0.0
 * @category utils
 */
export const getContentTypeFromExtension = (extension: string): MediaContentType => {
  const contentTypeMap: Record<string, MediaContentType> = {
    pdf: "application/pdf",
    json: "application/json",
    xml: "application/xml",
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    zip: "application/zip",
    gz: "application/gzip",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    doc: "application/vnd.ms-word",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
  return contentTypeMap[extension.toLowerCase().replace(".", "")] ?? "application/octet-stream"
}

/**
 * OData V2 types and schemas.
 *
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as Schema from "effect/Schema"

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

/**
 * Configuration for the OData client.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataClientConfigService {
  readonly baseUrl: string
  readonly servicePath: string
}

/**
 * OData client configuration tag.
 *
 * @since 1.0.0
 * @category context
 */
export class ODataClientConfig extends Context.Tag("ODataClientConfig")<
  ODataClientConfig,
  ODataClientConfigService
>() {}

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

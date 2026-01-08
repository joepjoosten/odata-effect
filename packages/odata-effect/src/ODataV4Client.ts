/**
 * OData V4 types and schemas.
 *
 * OData V4 uses different response formats than V2:
 * - Single entity: entity object with @odata.* annotations
 * - Collection: { value: [...], @odata.count?, @odata.nextLink? }
 * - Value: { value: T } or raw T for $value
 *
 * @since 1.0.0
 */
import * as Context from "effect/Context"
import * as Schema from "effect/Schema"

// ============================================================================
// V4 Response Schemas
// ============================================================================

/**
 * OData V4 annotations that can appear in responses.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataV4Annotations = Schema.Struct({
  "@odata.context": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.type": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.etag": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.id": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.editLink": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.readLink": Schema.optionalWith(Schema.String, { nullable: true }),
  "@odata.metadataEtag": Schema.optionalWith(Schema.String, { nullable: true })
})

/**
 * Type for V4 annotations.
 *
 * @since 1.0.0
 * @category models
 */
export type ODataV4Annotations = typeof ODataV4Annotations.Type

/**
 * OData V4 collection response wrapper.
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataV4CollectionResponse = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    "@odata.context": Schema.optionalWith(Schema.String, { nullable: true }),
    "@odata.count": Schema.optionalWith(Schema.Number, { nullable: true }),
    "@odata.nextLink": Schema.optionalWith(Schema.String, { nullable: true }),
    value: Schema.Array(schema)
  })

/**
 * OData V4 single value response (for property access).
 *
 * @since 1.0.0
 * @category schemas
 */
export const ODataV4ValueResponse = <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  Schema.Struct({
    "@odata.context": Schema.optionalWith(Schema.String, { nullable: true }),
    value: schema
  })

/**
 * Result of a V4 paged collection query.
 *
 * @since 1.0.0
 * @category models
 */
export interface PagedResultV4<A> {
  readonly value: ReadonlyArray<A>
  readonly count: number | undefined
  readonly nextLink: string | undefined
  readonly context: string | undefined
}

// ============================================================================
// V4 Query Options
// ============================================================================

/**
 * OData V4 query options.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataV4QueryOptions {
  readonly $filter?: string
  readonly $select?: string
  readonly $expand?: string
  readonly $orderby?: string
  readonly $top?: number
  readonly $skip?: number
  /** V4 uses $count=true to include count in response */
  readonly $count?: boolean
  /** Search expression (V4 only) */
  readonly $search?: string
  /** Compute expression (V4 only) */
  readonly $compute?: string
  /** Apply aggregation (V4 only) */
  readonly $apply?: string
}

/**
 * Request options for V4 operations with concurrency control.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataV4RequestOptions {
  /** ETag value for If-Match header */
  readonly etag?: string
  /** Use If-Match: * to force update/delete */
  readonly forceUpdate?: boolean
  /** Prefer header options */
  readonly prefer?: {
    /** Return representation after POST/PATCH */
    readonly return?: "representation" | "minimal"
    /** Max page size hint */
    readonly maxPageSize?: number
    /** Include count in response */
    readonly includeCount?: boolean
  }
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the OData V4 client.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataV4ClientConfigService {
  readonly baseUrl: string
  readonly servicePath: string
}

/**
 * OData V4 client configuration tag.
 *
 * @since 1.0.0
 * @category context
 */
export class ODataV4ClientConfig extends Context.Tag("ODataV4ClientConfig")<
  ODataV4ClientConfig,
  ODataV4ClientConfigService
>() {}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Builds an entity path with the given ID for V4.
 * V4 uses the same format as V2 for entity keys.
 *
 * @since 1.0.0
 * @category utils
 */
export const buildEntityPathV4 = (
  entitySet: string,
  id: string | number | { [key: string]: string | number }
): string => {
  if (typeof id === "string") {
    return `${entitySet}('${id}')`
  }
  if (typeof id === "number") {
    return `${entitySet}(${id})`
  }
  const entries = Object.entries(id)
  if (entries.length === 1) {
    const [, value] = entries[0]
    return typeof value === "string"
      ? `${entitySet}('${value}')`
      : `${entitySet}(${value})`
  }
  const keyParts = entries.map(([key, value]) => typeof value === "string" ? `${key}='${value}'` : `${key}=${value}`)
  return `${entitySet}(${keyParts.join(",")})`
}

/**
 * OData Effect - Effect-based OData client infrastructure.
 *
 * @since 1.0.0
 */

// ============================================================================
// Namespace Exports (for explicit imports)
// ============================================================================

/**
 * OData Batch Request Support.
 *
 * @since 1.0.0
 */
export * as Batch from "./Batch.js"

/**
 * Error types for OData services.
 *
 * @since 1.0.0
 */
export * as Errors from "./Errors.js"

/**
 * OData Media Entity Support.
 *
 * @since 1.0.0
 */
export * as Media from "./Media.js"

/**
 * OData V2 types and schemas.
 *
 * @since 1.0.0
 */
export * as ODataClient from "./ODataClient.js"

/**
 * Tree-shakable OData V2 client functions.
 *
 * @since 1.0.0
 */
export * as ODataClientFn from "./ODataClientFn.js"

/**
 * OData V4 types and schemas.
 *
 * @since 1.0.0
 */
export * as ODataV4Client from "./ODataV4Client.js"

/**
 * Tree-shakable OData V4 client functions.
 *
 * @since 1.0.0
 */
export * as ODataV4ClientFn from "./ODataV4ClientFn.js"

/**
 * OData Operations - Function Imports and Actions.
 *
 * @since 1.0.0
 */
export * as Operations from "./Operations.js"

/**
 * Type-safe OData query builder using Effect Schema.
 *
 * @since 1.0.0
 */
export * as QueryBuilderModule from "./QueryBuilder.js"

// ============================================================================
// Direct Exports for Convenience
// ============================================================================

// Errors
export {
  SapErrorDetail,
  SapErrorResolution,
  SapApplication,
  SapInnerError,
  SapErrorMessage,
  SapErrorBody,
  SapErrorResponse,
  ODataError,
  SapError,
  EntityNotFoundError,
  ParseError
} from "./Errors.js"

// OData V2 Client
export {
  ODataSingleResponse,
  ODataCollectionResponse,
  ODataCollectionResponseWithMeta,
  EntityMetadata,
  MediaMetadata,
  DeferredContent,
  ODataValueResponse,
  ODataClientConfig,
  buildEntityPath,
  DEFAULT_HEADERS,
  MERGE_HEADERS,
  type ODataQueryOptions,
  type ODataRequestOptions,
  type ODataClientConfigService,
  type PagedResult
} from "./ODataClient.js"

// OData V2 Client Functions
export {
  get,
  getCollection,
  getCollectionPaged,
  getValue,
  post,
  patch,
  del
} from "./ODataClientFn.js"

// Re-export namespace as OData for convenience
import * as _ODataClientFn from "./ODataClientFn.js"
export { _ODataClientFn as OData }

// OData V4 Client
export {
  ODataV4CollectionResponse,
  ODataV4ValueResponse,
  ODataV4Annotations,
  ODataV4ClientConfig,
  buildEntityPathV4,
  type ODataV4QueryOptions,
  type ODataV4RequestOptions,
  type ODataV4ClientConfigService,
  type PagedResultV4
} from "./ODataV4Client.js"

// OData V4 Client Functions
export {
  get as getV4,
  getCollection as getCollectionV4,
  getCollectionPaged as getCollectionPagedV4,
  getValue as getValueV4,
  post as postV4,
  patch as patchV4,
  put as putV4,
  del as delV4
} from "./ODataV4ClientFn.js"

// Re-export namespace as ODataV4 for convenience
import * as _ODataV4ClientFn from "./ODataV4ClientFn.js"
export { _ODataV4ClientFn as ODataV4 }

// Query Builder
export {
  FilterExpression,
  StringPath,
  NumberPath,
  BooleanPath,
  DateTimePath,
  EntityPath,
  CollectionPath,
  QueryBuilder,
  createQueryPaths,
  createQueryBuilder,
  type FieldToPath,
  type QueryPaths,
  type SelectableKeys,
  type ExpandableKeys,
  type BuiltQuery
} from "./QueryBuilder.js"

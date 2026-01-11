/**
 * OData client configuration.
 *
 * This module provides the unified configuration context tag used by both
 * OData V2 and V4 operations. Since V2 and V4 share the same configuration
 * structure (baseUrl and servicePath), a single config works for both.
 *
 * @example
 * ```ts
 * import { ODataClientConfig } from "@odata-effect/odata-effect/Config"
 * import * as Layer from "effect/Layer"
 *
 * const configLayer = Layer.succeed(ODataClientConfig, {
 *   baseUrl: "https://server.com",
 *   servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
 * })
 * ```
 *
 * @since 1.0.0
 */
import * as Context from "effect/Context"

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the OData client.
 *
 * This configuration is used by both V2 and V4 operations.
 *
 * @since 1.0.0
 * @category models
 */
export interface ODataClientConfigService {
  /** The base URL of the OData service (e.g., "https://server.com") */
  readonly baseUrl: string
  /** The service path (e.g., "/sap/opu/odata/sap/MY_SERVICE/") */
  readonly servicePath: string
}

/**
 * OData client configuration tag.
 *
 * This is the unified configuration context used by both V2 and V4 operations.
 * You only need to provide this once, and it will work with both OData versions.
 *
 * @since 1.0.0
 * @category context
 */
export class ODataClientConfig extends Context.Tag("ODataClientConfig")<
  ODataClientConfig,
  ODataClientConfigService
>() {}

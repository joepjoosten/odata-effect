# @odata-effect/odata-effect

## 0.4.0

### Minor Changes

- [`5f2449e`](https://github.com/joepjoosten/odata-effect/commit/5f2449e8da46cfae51f6f5a463ee8275c76c79ab) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Unified ODataClientConfig for V2 and V4, platform-independent HTTP client

  ### @odata-effect/odata-effect

  - Added `Config` module with unified `ODataClientConfig` context tag
  - V2 and V4 now share the same configuration (`ODataClientConfig`)
  - Removed `ODataV4ClientConfig` and `ODataV4ClientConfigService` (use `ODataClientConfig` and `ODataClientConfigService` instead)

  ### @odata-effect/odata-effect-promise

  **Breaking Changes:**

  - `createODataRuntime` now requires an `httpClientLayer` parameter for platform independence
  - Removed `createODataV4Runtime` (use `createODataRuntime` for both V2 and V4)
  - Removed `ODataV4Runtime` type (use `ODataRuntime` for both V2 and V4)
  - Removed `@effect/platform-node` from dependencies (users must provide their own HTTP client layer)

  **Migration:**

  Before:

  ```typescript
  import { createODataRuntime } from "@odata-effect/odata-effect-promise";

  const runtime = createODataRuntime({
    baseUrl: "https://server.com",
    servicePath: "/odata/",
  });
  ```

  After:

  ```typescript
  import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient";
  import { createODataRuntime } from "@odata-effect/odata-effect-promise";

  const runtime = createODataRuntime(
    { baseUrl: "https://server.com", servicePath: "/odata/" },
    NodeHttpClient.layer
  );
  ```

  For Bun:

  ```typescript
  import * as BunHttpClient from "@effect/platform-bun/BunHttpClient";
  import { createODataRuntime } from "@odata-effect/odata-effect-promise";

  const runtime = createODataRuntime(
    { baseUrl: "https://server.com", servicePath: "/odata/" },
    BunHttpClient.layer
  );
  ```

## 0.3.1

### Patch Changes

- [`7f74d96`](https://github.com/joepjoosten/odata-effect/commit/7f74d9637c447983450178a6f6219149e3adaee8) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Support optional parameters in OData operations

  Added `undefined` to the `OperationParameters` type and filter out undefined values when building function import URLs. This allows callers to pass optional parameters that are excluded from the generated URL when not provided.

## 0.3.0

### Minor Changes

- Merge ODataClient/ODataV4Client modules into OData/ODataV4

  **BREAKING CHANGE:** The `ODataClient` and `ODataV4Client` modules have been removed. All their exports are now available in `OData` and `ODataV4` respectively.

  Before:

  ```ts
  import { OData, ODataClient } from "@odata-effect/odata-effect";
  const config = ODataClient.ODataClientConfig;
  ```

  After:

  ```ts
  import { OData } from "@odata-effect/odata-effect";
  const config = OData.ODataClientConfig;
  ```

  This simplifies the API - each version (V2/V4) now has a single module containing everything: config, schemas, types, and operations.

## 0.2.0

### Minor Changes

- Add CRUD factory for type-safe entity operations

  **@odata-effect/odata-effect:**

  - Add `Crud` module with `crud()` factory for OData V2 entity services
  - Add `CrudV4` module with `crud()` factory for OData V4 entity services
  - Provides `getAll`, `getById`, `create`, `update`, `delete` operations
  - Can be used standalone or with generated code

  **@odata-effect/odata-effect-generator:**

  - Simplify generated `Services.ts` to use the crud factory instead of generating duplicate CRUD code
  - Reduces generated code size significantly

## 0.1.0

### Minor Changes

- [`181dc6a`](https://github.com/joepjoosten/odata-effect/commit/181dc6af616ab274e8380dbbf10486eddb5eb3a9) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Initial release of odata-effect packages, including core OData client, Promise-based wrapper, and code generator for type-safe service clients.

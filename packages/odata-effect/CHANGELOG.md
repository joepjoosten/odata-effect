# @odata-effect/odata-effect

## 0.6.4

### Patch Changes

- [`1f881c1`](https://github.com/joepjoosten/odata-effect/commit/1f881c1d74667ae78876bb178d09d460bf8ce538) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix bugs from demo feedback:

  **@odata-effect/odata-effect:**

  - Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
  - Fix numeric key handling in V2 URLs (no longer quoted as strings)
  - Update EntityKey type to support numeric keys in V2
  - Add DateTime.DateTime and BigDecimal.BigDecimal type support in QueryBuilder FieldToPath mapping

  **@odata-effect/odata-effect-generator:**

  - Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
  - Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts
  - Remove unused Effect import from generated PathBuilders.ts
  - Fix Edm.Decimal queryPath to use NumberPath for numeric comparisons in OData queries

## 0.6.3

### Patch Changes

- [`3aff504`](https://github.com/joepjoosten/odata-effect/commit/3aff50455a919035113c810e439595addffc31fc) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix bugs from demo feedback:

  **@odata-effect/odata-effect:**

  - Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
  - Fix numeric key handling in V2 URLs (no longer quoted as strings)
  - Update EntityKey type to support numeric keys in V2
  - Add DateTime.DateTime and BigDecimal.BigDecimal type support in QueryBuilder FieldToPath mapping

  **@odata-effect/odata-effect-generator:**

  - Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
  - Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts
  - Remove unused Effect import from generated PathBuilders.ts

## 0.6.2

### Patch Changes

- [`715de50`](https://github.com/joepjoosten/odata-effect/commit/715de505b7fc1fa9d95ff07e090a938e39acc59b) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix 6 bugs from demo feedback:

  **@odata-effect/odata-effect:**

  - Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
  - Fix numeric key handling in V2 URLs (no longer quoted as strings)
  - Add DateTime.DateTime type support in QueryBuilder FieldToPath mapping

  **@odata-effect/odata-effect-generator:**

  - Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
  - Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts

## 0.6.1

### Patch Changes

- [`a4bf44c`](https://github.com/joepjoosten/odata-effect/commit/a4bf44ca095d61ba40c093c152e17486b29eee51) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Update ODataSchema documentation to reflect Effect types usage

## 0.6.0

### Minor Changes

- [`6262480`](https://github.com/joepjoosten/odata-effect/commit/626248078c571ca28eb5168fe6d647ab0f523e3f) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add OData-specific Effect Schema types for proper V2/V4 wire format handling

  OData V2 and V4 use different wire formats that require special encoding/decoding. This adds schemas that properly handle these formats using Effect's built-in types:

  **Effect Types Used:**

  - `DateTime.Utc` / `DateTime.Zoned` for date/time values
  - `BigDecimal.BigDecimal` for Int64 and Decimal (preserves precision)
  - `Duration.Duration` for time durations

  **OData V2 Formats:**

  - `Edm.DateTime`: `/Date(milliseconds)/` → `DateTime.Utc`
  - `Edm.DateTimeOffset`: `/Date(milliseconds+offset)/` → `DateTime.Zoned`
  - `Edm.Time`: ISO 8601 duration (`PT12H30M15S`) → `Duration.Duration`
  - `Edm.Int64`, `Edm.Decimal`: Strings → `BigDecimal.BigDecimal`
  - `Edm.Byte`, `Edm.SByte`, `Edm.Single`, `Edm.Double`: Strings → `number`

  **OData V4 Formats:**

  - `Edm.DateTimeOffset`: ISO 8601 (`2022-12-31T23:59:59Z`) → `DateTime.Zoned`
  - `Edm.Date`: Date-only (`2022-12-31`) → `DateTime.Utc`
  - `Edm.Duration`: ISO 8601 duration → `Duration.Duration`

  **New ODataSchema Module:**

  ```typescript
  import { ODataSchema } from "@odata-effect/odata-effect";
  import * as Schema from "effect/Schema";

  // V2 DateTime: "/Date(1672531199000)/" -> DateTime.Utc
  const dateField = ODataSchema.ODataV2DateTime;

  // V4 Date: "2022-12-31" -> DateTime.Utc
  const dateOnlyField = ODataSchema.ODataV4Date;

  // V2 Int64: "9007199254740993" -> BigDecimal.BigDecimal
  const int64Field = ODataSchema.ODataV2Int64;

  // V2 Time: "PT12H30M15S" -> Duration.Duration
  const timeField = ODataSchema.ODataV2Time;
  ```

  **Generator Updates:**

  The generator now uses these OData-specific schemas and automatically adds required Effect type imports (DateTime, BigDecimal, Duration) to generated Models when needed.

## 0.5.1

### Patch Changes

- [`ce2be6a`](https://github.com/joepjoosten/odata-effect/commit/ce2be6a77afe32ac915949e4a622386fe7caca3d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix lint formatting issues (import ordering and quote styles)

## 0.5.0

### Minor Changes

- [`9fcf492`](https://github.com/joepjoosten/odata-effect/commit/9fcf4924c8e8d3acece1b85916888250a37138bd) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add HTTP method tunneling support via X-HTTP-Method header

  Added `useTunneling` option to `ODataClientConfigService`. When enabled, PUT, PATCH, and DELETE requests are tunneled via POST using the `X-HTTP-Method` header. This is useful when firewalls or proxies block these HTTP methods.

  ```typescript
  const config = {
    baseUrl: "https://server.com",
    servicePath: "/odata/",
    useTunneling: true,
  };
  ```

  When `useTunneling: true`:

  - **V2**: DELETE uses POST with `X-HTTP-Method: DELETE` (PATCH already uses POST with `X-Http-Method: MERGE`)
  - **V4**: PATCH uses POST with `X-HTTP-Method: PATCH`, PUT uses POST with `X-HTTP-Method: PUT`, DELETE uses POST with `X-HTTP-Method: DELETE`

- [`9fcf492`](https://github.com/joepjoosten/odata-effect/commit/9fcf4924c8e8d3acece1b85916888250a37138bd) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Unified ODataClientConfig, platform-independent HTTP client, and request tunneling support

  ### @odata-effect/odata-effect

  - Added `Config` module with unified `ODataClientConfig` context tag
  - V2 and V4 now share the same configuration (`ODataClientConfig`)
  - Removed `ODataV4ClientConfig` and `ODataV4ClientConfigService` (use `ODataClientConfig` and `ODataClientConfigService` instead)
  - Added `useTunneling` option to tunnel PUT, PATCH, and DELETE requests via POST using the X-HTTP-Method header

  **Request Tunneling:**

  When `useTunneling: true` is set in the config, PUT, PATCH, and DELETE requests are sent as POST requests with the `X-HTTP-Method` header. This is useful when firewalls or proxies block these HTTP methods.

  ```typescript
  const config = {
    baseUrl: "https://server.com",
    servicePath: "/odata/",
    useTunneling: true, // PUT/PATCH/DELETE will use POST with X-HTTP-Method header
  };
  ```

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

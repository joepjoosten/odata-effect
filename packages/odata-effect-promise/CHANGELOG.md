# @odata-effect/odata-effect-promise

## 3.0.8

### Patch Changes

- Updated dependencies [[`b774df8`](https://github.com/joepjoosten/odata-effect/commit/b774df8e095ddf7d413a0f80a805eb604303476f)]:
  - @odata-effect/odata-effect@0.6.6

## 3.0.7

### Patch Changes

- Updated dependencies [[`08ac524`](https://github.com/joepjoosten/odata-effect/commit/08ac52496751bfc763daedc91d3dd30f0c4cdc53)]:
  - @odata-effect/odata-effect@0.6.5

## 3.0.6

### Patch Changes

- Updated dependencies [[`1f881c1`](https://github.com/joepjoosten/odata-effect/commit/1f881c1d74667ae78876bb178d09d460bf8ce538)]:
  - @odata-effect/odata-effect@0.6.4

## 3.0.5

### Patch Changes

- Updated dependencies [[`3aff504`](https://github.com/joepjoosten/odata-effect/commit/3aff50455a919035113c810e439595addffc31fc)]:
  - @odata-effect/odata-effect@0.6.3

## 3.0.4

### Patch Changes

- Updated dependencies [[`715de50`](https://github.com/joepjoosten/odata-effect/commit/715de505b7fc1fa9d95ff07e090a938e39acc59b)]:
  - @odata-effect/odata-effect@0.6.2

## 3.0.3

### Patch Changes

- Updated dependencies [[`a4bf44c`](https://github.com/joepjoosten/odata-effect/commit/a4bf44ca095d61ba40c093c152e17486b29eee51)]:
  - @odata-effect/odata-effect@0.6.1

## 3.0.2

### Patch Changes

- Updated dependencies [[`6262480`](https://github.com/joepjoosten/odata-effect/commit/626248078c571ca28eb5168fe6d647ab0f523e3f)]:
  - @odata-effect/odata-effect@0.6.0

## 3.0.1

### Patch Changes

- [`ce2be6a`](https://github.com/joepjoosten/odata-effect/commit/ce2be6a77afe32ac915949e4a622386fe7caca3d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix lint formatting issues (import ordering and quote styles)

- Updated dependencies [[`ce2be6a`](https://github.com/joepjoosten/odata-effect/commit/ce2be6a77afe32ac915949e4a622386fe7caca3d)]:
  - @odata-effect/odata-effect@0.5.1

## 3.0.0

### Major Changes

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

### Patch Changes

- Updated dependencies [[`9fcf492`](https://github.com/joepjoosten/odata-effect/commit/9fcf4924c8e8d3acece1b85916888250a37138bd), [`9fcf492`](https://github.com/joepjoosten/odata-effect/commit/9fcf4924c8e8d3acece1b85916888250a37138bd)]:
  - @odata-effect/odata-effect@0.5.0

## 2.0.0

### Major Changes

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

### Patch Changes

- Updated dependencies [[`5f2449e`](https://github.com/joepjoosten/odata-effect/commit/5f2449e8da46cfae51f6f5a463ee8275c76c79ab)]:
  - @odata-effect/odata-effect@0.4.0

## 1.0.1

### Patch Changes

- Updated dependencies [[`7f74d96`](https://github.com/joepjoosten/odata-effect/commit/7f74d9637c447983450178a6f6219149e3adaee8)]:
  - @odata-effect/odata-effect@0.3.1

## 1.0.0

### Major Changes

- Remove OData and ODataV4 wrapper modules in favor of toPromise

  **BREAKING CHANGE:** The `OData` and `ODataV4` namespace exports have been removed from this package.

  Before:

  ```typescript
  import * as OData from "@odata-effect/odata-effect-promise/OData";
  const product = await OData.get(runtime, "Products('1')", ProductSchema);
  ```

  After:

  ```typescript
  import { pipe } from "effect";
  import { OData } from "@odata-effect/odata-effect";
  import { toPromise } from "@odata-effect/odata-effect-promise";

  const product = await pipe(
    OData.get("Products('1')", ProductSchema),
    toPromise(runtime)
  );
  ```

  The new pattern is more composable and works with any Effect-based operation:

  - OData/ODataV4 functions from `@odata-effect/odata-effect`
  - Generated CRUD services
  - Generated PathBuilders

## 0.2.0

### Minor Changes

- c65f777: Add `toPromise` helper for composable Effect-to-Promise conversion

  **@odata-effect/odata-effect-promise:**

  - Add `toPromise(runtime)` function that can be used at the end of any pipe chain
  - Export directly from the main entry point for convenience
  - Works with any Effect-based OData operation

  **@odata-effect/odata-effect-generator:**

  - PathBuilders now import and re-export `toPromise` from `@odata-effect/odata-effect-promise`
  - Reduces generated code duplication

  Usage:

  ```typescript
  import { pipe } from "effect";
  import { OData } from "@odata-effect/odata-effect";
  import {
    createODataRuntime,
    toPromise,
  } from "@odata-effect/odata-effect-promise";

  const runtime = createODataRuntime({ baseUrl: "...", servicePath: "..." });

  // Use with any Effect
  const product = await pipe(
    OData.get("Products('1')", ProductSchema),
    toPromise(runtime)
  );

  // Use with generated services
  const products = await pipe(ProductService.getAll(), toPromise(runtime));
  ```

## 0.1.2

### Patch Changes

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

- Updated dependencies []:
  - @odata-effect/odata-effect@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @odata-effect/odata-effect@0.2.0

## 0.1.0

### Minor Changes

- [`181dc6a`](https://github.com/joepjoosten/odata-effect/commit/181dc6af616ab274e8380dbbf10486eddb5eb3a9) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Initial release of odata-effect packages, including core OData client, Promise-based wrapper, and code generator for type-safe service clients.

### Patch Changes

- Updated dependencies [[`181dc6a`](https://github.com/joepjoosten/odata-effect/commit/181dc6af616ab274e8380dbbf10486eddb5eb3a9)]:
  - @odata-effect/odata-effect@0.1.0

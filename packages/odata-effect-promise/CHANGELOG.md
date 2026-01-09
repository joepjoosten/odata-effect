# @odata-effect/odata-effect-promise

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

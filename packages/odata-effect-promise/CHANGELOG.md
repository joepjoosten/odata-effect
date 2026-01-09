# @odata-effect/odata-effect-promise

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

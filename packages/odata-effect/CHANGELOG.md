# @odata-effect/odata-effect

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

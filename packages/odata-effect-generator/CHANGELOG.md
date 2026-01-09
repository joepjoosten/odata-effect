# @odata-effect/odata-effect-generator

## 0.2.1

### Patch Changes

- Fix composite key ID type generation to use only Struct schema instead of Union with String

  Previously, composite keys were generated as `Schema.Union(Schema.String, Schema.Struct({ ... }))` which made no sense - a single string cannot represent multiple key values. Now composite keys correctly generate as just `Schema.Struct({ key1: ..., key2: ... })`.

## 0.2.0

### Minor Changes

- [`8dc61e5`](https://github.com/joepjoosten/odata-effect/commit/8dc61e5ceb2d5823794043f062a630f99dd3e155) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add `--files-only` option to generate only source files without project configuration files (package.json, tsconfig, etc.). When enabled, files are output directly to the output directory instead of a src/ subdirectory.

  Also fixed:

  - Removed unnecessary re-exports from @odata-effect/odata-effect in generated index.ts
  - Removed `.js` extensions from local imports in generated files
  - Fixed QueryModels.ts to use subpath import for QueryBuilder

- [`87176f4`](https://github.com/joepjoosten/odata-effect/commit/87176f437c3165c101d126e2d6cfa047cb022bdc) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add Operations.ts generation for unbound OData operations.

  **New Features:**

  - Generates `Operations.ts` for FunctionImports (V2) and unbound Functions/Actions (V4)
  - Automatic parameter handling for functions with required/optional parameters
  - Support for both POST (Actions) and GET (Functions) HTTP methods
  - Only generated when the service defines unbound operations

  **Usage:**

  ```typescript
  import { Operations } from "./generated";

  // V4 Function (GET, no side effects)
  const airport =
    yield * Operations.getNearestAirport({ lat: 51.5, lon: -0.1 });

  // V4 Action (POST, may have side effects)
  yield * Operations.resetDataSource();

  // V2 FunctionImport
  const products = yield * Operations.getProductsByRating({ rating: 5 });
  ```

- [`87176f4`](https://github.com/joepjoosten/odata-effect/commit/87176f437c3165c101d126e2d6cfa047cb022bdc) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add tree-shakable PathBuilders for type-safe OData navigation using pipe().

  **New Features:**

  - `PathBuilders.ts` - Generates branded path types and navigation functions
  - Fully tree-shakable: each navigation function is a separate export
  - Type-safe navigation enforced at compile time via branded `Path<TEntity, IsCollection>` type
  - Support for entity inheritance with type casting functions (`asFlight`, `asEvent`, etc.)
  - Terminal operations: `fetchCollection(Schema)` and `fetchOne(Schema)`
  - Model suffix for type imports (`Person as PersonModel`) to avoid naming collisions

  **Usage:**

  ```typescript
  import { pipe } from "effect";
  import {
    People,
    byKey,
    trips,
    planItems,
    asFlight,
    fetchCollection,
  } from "./generated";
  import { Flight } from "./generated";

  const flights =
    yield *
    pipe(
      People, // Path<PersonModel, true>
      byKey("russellwhyte"), // Path<PersonModel, false>
      trips, // Path<TripModel, true>
      byKey(0), // Path<TripModel, false>
      planItems, // Path<PlanItemModel, true>
      asFlight, // Path<FlightModel, true>
      fetchCollection(Flight)
    );
  ```

  **Breaking Change:** Replaces the previous object-based `*Navigation.ts` files with the new pipe-based `PathBuilders.ts` approach.

## 0.1.2

### Patch Changes

- [`c810201`](https://github.com/joepjoosten/odata-effect/commit/c810201ba565419cb48a152386cb378304a5f4cb) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix generated service imports to use subpath imports instead of main package exports. The generated code now correctly imports from `@odata-effect/odata-effect/ODataClient`, `@odata-effect/odata-effect/ODataV4Client`, `@odata-effect/odata-effect/OData`, `@odata-effect/odata-effect/ODataV4`, and `@odata-effect/odata-effect/Errors` for proper tree-shaking support.

  Also fixed CLI documentation to show correct usage: `odata-effect-gen generate <metadata-path> <output-dir>`

## 0.1.1

### Patch Changes

- [`e019e3e`](https://github.com/joepjoosten/odata-effect/commit/e019e3e488667b5e868c91b04cd25fc26187762d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix bin path for CLI executable. The `odata-effect-gen` command was not working due to incorrect path in package.json.

## 0.1.0

### Minor Changes

- [`181dc6a`](https://github.com/joepjoosten/odata-effect/commit/181dc6af616ab274e8380dbbf10486eddb5eb3a9) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Initial release of odata-effect packages, including core OData client, Promise-based wrapper, and code generator for type-safe service clients.

# @odata-effect/odata-effect-generator

## 0.5.0

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

## 0.4.1

### Patch Changes

- [`ce2be6a`](https://github.com/joepjoosten/odata-effect/commit/ce2be6a77afe32ac915949e4a622386fe7caca3d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix lint formatting issues (import ordering and quote styles)

## 0.4.0

### Minor Changes

- [`ac88ead`](https://github.com/joepjoosten/odata-effect/commit/ac88ead496fabea4143b4a3b4402f98e06abeb26) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add property name mapping with Schema.fromKey for OData V2 compatibility

  OData V2 responses use PascalCase property names (e.g., `ID`, `ReleaseDate`), but the generator converts them to camelCase for TypeScript (e.g., `id`, `releaseDate`). This caused schema validation failures because the decoded property names didn't match the JSON.

  **Schema.fromKey Mapping:**

  Generated schemas now use `Schema.propertySignature` with `Schema.fromKey` to map between encoded (PascalCase) and decoded (camelCase) property names:

  ```typescript
  // Before (caused validation errors with OData V2 responses)
  export class Product extends Schema.Class<Product>("Product")({
    id: Schema.Number,
    productName: Schema.String,
  })

  // After (correctly maps OData property names)
  export class Product extends Schema.Class<Product>("Product")({
    id: Schema.propertySignature(Schema.Number).pipe(Schema.fromKey("ID")),
    productName: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ProductName")),
  })
  ```

  **Custom Name Overrides:**

  Added support for custom property and type name overrides via a JSON config file:

  ```bash
  odata-effect-gen generate metadata.xml ./output --config odata-effect.config.json
  ```

  Config file format:

  ```json
  {
    "overrides": {
      "properties": {
        "ID": "id",
        "SKU": "sku"
      },
      "entities": {
        "Product": {
          "name": "Product",
          "properties": {
            "ProductID": "productId"
          }
        }
      },
      "complexTypes": {
        "Address": {
          "properties": {
            "ZIPCode": "zipCode"
          }
        }
      },
      "operations": {
        "GetProductsByRating": {
          "name": "fetchProductsByRating",
          "parameters": {
            "rating": "minRating"
          }
        }
      }
    }
  }
  ```

  This allows:

  - Global property name overrides (e.g., `ID` → `id` instead of `iD`)
  - Entity-specific property overrides
  - Complex type-specific property overrides
  - Type name overrides
  - Operation name overrides (function imports, functions, actions)
  - Operation parameter name overrides

  **QueryModels Integration:**

  The NamingOverrides also flow through to QueryModels generation. Query interfaces use TypeScript names while path constructors use OData names:

  ```typescript
  // Generated QueryModels.ts
  export interface QProduct {
    readonly id: NumberPath; // TypeScript name from override
    readonly productName: StringPath; // TypeScript name from override
  }

  export const qProduct: QProduct = {
    id: new NumberPath("ID"), // OData name for queries
    productName: new StringPath("ProductName"), // OData name for queries
  };
  ```

  This ensures type-safe query building with proper OData protocol compatibility.

  **Operations Integration:**

  Operations (function imports, functions, actions) also support naming overrides and proper name mapping:

  ```typescript
  // Generated Operations.ts
  export interface GetProductsByRatingParams {
    readonly minRating: number  // TypeScript name from override
  }

  export const fetchProductsByRating = (
    params: GetProductsByRatingParams
  ): Effect.Effect<...> =>
    Effect.gen(function*() {
      const parameters: ODataOps.OperationParameters = {
        "rating": params.minRating,  // Maps to OData parameter name
      }
      // ...
    })
  ```

  This ensures TypeScript code uses friendly names while OData API calls use the correct protocol names.

## 0.3.2

### Patch Changes

- [`85cff95`](https://github.com/joepjoosten/odata-effect/commit/85cff95e675e22972b6cdb0c7c91053d2e727282) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix OperationsGenerator using incorrect module paths

  The OperationsGenerator was importing from the old module paths (`ODataClient` and `ODataV4Client`) which were renamed to `OData` and `ODataV4`. This caused TypeScript to fail type inference, resulting in generated operations returning `Effect<T, unknown, unknown>` instead of the proper error and context types.

## 0.3.1

### Patch Changes

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

## 0.3.0

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

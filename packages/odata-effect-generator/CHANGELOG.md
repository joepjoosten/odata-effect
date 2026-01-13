# @odata-effect/odata-effect-generator

## 0.6.11

### Patch Changes

- [`135a237`](https://github.com/joepjoosten/odata-effect/commit/135a2375c1c5e3c3329d3fe0b7a05cba14d2649a) Thanks [@joepjoosten](https://github.com/joepjoosten)! - - Fix: Generated Operations.ts now correctly imports only required modules:
  - `Schema` when return types use primitive schema types (not for parameters)
  - `ODataSchema` when return types use OData-specific schemas (not for parameters)
  - `DateTime` when parameters/returns use `DateTime.DateTime.Utc` or `DateTime.DateTime.Zoned`
  - `Duration` when parameters/returns use `Duration.Duration`
  - `BigDecimal` when parameters/returns use `BigDecimal.BigDecimal`
  - Simplify generated fromKey mappings: use `Schema.String.pipe(Schema.fromKey("ID"))` instead of `Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))`
  - Simplify generated optional fields: use `Schema.NullishOr(Schema.String)` instead of `Schema.optionalWith(Schema.String, { nullable: true })`

## 0.6.10

### Patch Changes

- [`c349ceb`](https://github.com/joepjoosten/odata-effect/commit/c349ceb65ec3b1d72dad681cff432d88e9487d7f) Thanks [@joepjoosten](https://github.com/joepjoosten)! - - Fix: Generated Operations.ts now correctly imports Schema and ODataSchema when operations use DateTime, BigDecimal, or other special types
  - Simplify generated fromKey mappings: use `Schema.String.pipe(Schema.fromKey("ID"))` instead of `Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))`
  - Simplify generated optional fields: use `Schema.NullishOr(Schema.String)` instead of `Schema.optionalWith(Schema.String, { nullable: true })`

## 0.6.9

### Patch Changes

- [`e5d3757`](https://github.com/joepjoosten/odata-effect/commit/e5d3757a7f6be951132dad616d66935214f7b5cf) Thanks [@joepjoosten](https://github.com/joepjoosten)! - **@odata-effect/odata-effect-generator:**
  - Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability
  - CLI: `--config` now accepts JSON string directly (e.g., `--config '{"esmExtensions": true}'`) or a file path
  - Change default for `esmExtensions` from `true` to `false`

## 0.6.8

### Patch Changes

- [`67dd37c`](https://github.com/joepjoosten/odata-effect/commit/67dd37ca183051ae23ae82e7fb1525ce7d71ff5e) Thanks [@joepjoosten](https://github.com/joepjoosten)! - **@odata-effect/odata-effect-generator:**

  - Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability

  **@odata-effect/odata-effect:**

  - Add ODataClientError and ODataClientDependencies type aliases for declaration portability
  - Add ODataV4ClientError and ODataV4ClientDependencies type aliases for declaration portability
  - Add support for OData V3 single entity response format (entity at root with odata.metadata) in get, getComplex, expandDeferred, post, and executeFunctionImportEntity
  - Add ISO 8601 datetime format support to ODataV2DateTime and ODataV2DateTimeOffset schemas for V3 compatibility

## 0.6.7

### Patch Changes

- [`2fc9d9b`](https://github.com/joepjoosten/odata-effect/commit/2fc9d9b535f5c45d8546bcba266430b47c20f60d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - **@odata-effect/odata-effect-generator:**

  - Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability

  **@odata-effect/odata-effect:**

  - Add ODataClientError and ODataClientDependencies type aliases for declaration portability
  - Add ODataV4ClientError and ODataV4ClientDependencies type aliases for declaration portability
  - Add support for OData V3 single entity response format (entity at root with odata.metadata) in get, getComplex, expandDeferred, post, and executeFunctionImportEntity

## 0.6.6

### Patch Changes

- [`b774df8`](https://github.com/joepjoosten/odata-effect/commit/b774df8e095ddf7d413a0f80a805eb604303476f) Thanks [@joepjoosten](https://github.com/joepjoosten)! - **@odata-effect/odata-effect-generator:**

  - Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability

  **@odata-effect/odata-effect:**

  - Add ODataClientError and ODataClientDependencies type aliases for declaration portability
  - Add ODataV4ClientError and ODataV4ClientDependencies type aliases for declaration portability

## 0.6.5

### Patch Changes

- [`1b687d9`](https://github.com/joepjoosten/odata-effect/commit/1b687d9b7907156200e5c2fb6bdb5cdea048e9e2) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Convert branded types (BigDecimal, DateTime, Duration) to string in generated idToKey functions for EntityKey compatibility

## 0.6.4

### Patch Changes

- [`08ac524`](https://github.com/joepjoosten/odata-effect/commit/08ac52496751bfc763daedc91d3dd30f0c4cdc53) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix bugs from demo feedback:

  **@odata-effect/odata-effect:**

  - Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
  - Add support for OData V3/V4 response format `{ value: [...] }` with automatic runtime detection
  - Fix numeric key handling in V2 URLs (no longer quoted as strings)
  - Update EntityKey type to support string, number, and boolean key values
  - Add DateTime.DateTime and BigDecimal.BigDecimal type support in QueryBuilder FieldToPath mapping

  **@odata-effect/odata-effect-generator:**

  - Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
  - Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts
  - Remove unused Effect import from generated PathBuilders.ts
  - Fix Edm.Decimal queryPath to use NumberPath for numeric comparisons in OData queries

## 0.6.3

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

## 0.6.2

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

## 0.6.1

### Patch Changes

- [`715de50`](https://github.com/joepjoosten/odata-effect/commit/715de505b7fc1fa9d95ff07e090a938e39acc59b) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix 6 bugs from demo feedback:

  **@odata-effect/odata-effect:**

  - Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
  - Fix numeric key handling in V2 URLs (no longer quoted as strings)
  - Add DateTime.DateTime type support in QueryBuilder FieldToPath mapping

  **@odata-effect/odata-effect-generator:**

  - Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
  - Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts

## 0.6.0

### Minor Changes

- [`e795826`](https://github.com/joepjoosten/odata-effect/commit/e795826b6df97d4435771d8b590b5c76592a0ccb) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Add configurable `.js` extensions for generated imports (ESM compatibility)

  Generated files now include `.js` extensions on relative imports by default, enabling compatibility with:

  - `moduleResolution: node16` / `nodenext`
  - Native Node.js ESM (no bundler)

  The `esmExtensions` option can be used to control this behavior:

  ```typescript
  import { generate } from "@odata-effect/odata-effect-generator";

  // Default: with .js extensions (ESM compatible)
  generate(dataModel, { outputDir: "./output" });
  // Generated: import { Product } from "./Models.js"

  // Opt-out for bundler setups
  generate(dataModel, { outputDir: "./output", esmExtensions: false });
  // Generated: import { Product } from "./Models"
  ```

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

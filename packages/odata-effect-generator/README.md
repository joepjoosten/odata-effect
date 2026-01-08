# @odata-effect/odata-effect-generator

Code generator for Effect-based OData service clients. Generates type-safe TypeScript code from OData metadata.

## Installation

```bash
npm install -g @odata-effect/odata-effect-generator
# or
pnpm add -g @odata-effect/odata-effect-generator
```

## Usage

```bash
odata-effect-gen generate ./metadata.xml ./generated
```

### Arguments

- `<metadata-path>`: Path to OData metadata XML file (required)
- `<output-dir>`: Output directory for generated code (required)

### Options

- `--service-name`: Override service name (defaults to EntityContainer name)
- `--package-name`: NPM package name (defaults to @template/<service-name>-effect)
- `--force`: Overwrite existing files
- `--files-only`: Generate only source files directly in output-dir (no package.json, tsconfig, src/ subdirectory)

## Generated Code

The generator produces:

| File | Description |
|------|-------------|
| `Models.ts` | Schema classes for entities and complex types |
| `QueryModels.ts` | Type-safe query paths for filtering and ordering |
| `*Service.ts` | Effect-based CRUD service functions for each entity set |
| `PathBuilders.ts` | Tree-shakable navigation path builders with `toPromise` |
| `Operations.ts` | Functions/Actions (if present in metadata) |
| `index.ts` | Re-exports all generated code |

## Two Ways to Query Data

The generator provides two complementary approaches for querying OData services:

### 1. Service Functions (Direct Operations)

Best for simple CRUD operations on a single entity set:

```typescript
import { ProductService } from "./generated"

// Get all products
const products = yield* ProductService.getAll()

// Get by ID
const product = yield* ProductService.getById(123)

// Create
const newProduct = yield* ProductService.create({ name: "Widget", price: 9.99 })

// Update
yield* ProductService.update(123, { price: 12.99 })

// Delete
yield* ProductService.delete(123)
```

### 2. Path Builders (Pipe-based Navigation)

Best for navigating relationships with full type safety. Uses branded types to ensure you can only navigate to valid properties:

```typescript
import { pipe } from "effect"
import {
  People, byKey, trips, planItems, asFlight, bestFriend,
  fetchCollection, fetchOne
} from "./generated"
import { Person, Trip, Flight } from "./generated"

// Navigate through relationships with pipe()
const flights = yield* pipe(
  People,                    // Path<PersonModel, true>  - collection
  byKey("russellwhyte"),     // Path<PersonModel, false> - single entity
  trips,                     // Path<TripModel, true>    - collection
  byKey(0),                  // Path<TripModel, false>   - single entity
  planItems,                 // Path<PlanItemModel, true>
  asFlight,                  // Path<FlightModel, true>  - type cast
  fetchCollection(Flight)    // Execute the query
)

// Get a single entity
const person = yield* pipe(
  People,
  byKey("russellwhyte"),
  fetchOne(Person)
)

// Navigate to a single related entity
const friend = yield* pipe(
  People,
  byKey("russellwhyte"),
  bestFriend,
  fetchOne(Person)
)
```

### Type Safety with Branded Types

The path builders use branded types to ensure type-safe navigation at compile time:

```typescript
// Path<TEntity, IsCollection> tracks what entity type you're "at"
type Path<TEntity, IsCollection extends boolean = false> = string & {
  readonly _entity: TEntity
  readonly _collection: IsCollection
}

// TypeScript prevents invalid navigation:

// ✅ Valid - trips is a navigation property on Person
pipe(People, byKey("russell"), trips)

// ❌ Compile error - planItems is on Trip, not Person
pipe(People, byKey("russell"), planItems)

// ❌ Compile error - can't byKey on a single entity (not a collection)
pipe(People, byKey("russell"), byKey("other"))
```

### Path Builder Features

| Feature | Example |
|---------|---------|
| Entity set root | `People` → `Path<PersonModel, true>` |
| Key access | `byKey("id")` → converts collection to single |
| Navigation | `trips` → type-safe navigation to related entity |
| Type casting | `asFlight` → filter to derived type |
| Terminal ops | `fetchCollection(Schema)`, `fetchOne(Schema)` |

### Tree-Shaking

Path builders are fully tree-shakable. Each navigation function is a separate export:

```typescript
// Only import what you use - unused navigation functions are removed by bundler
import { People, byKey, trips } from "./generated"
```

### Comparison with odata2ts

If you're familiar with odata2ts, here's how the APIs compare:

```typescript
// odata2ts (method chaining)
const response = await trippinService
  .people("russellwhyte")
  .trips(0)
  .planItems()
  .asFlightCollectionService()
  .query()

// odata-effect (pipe composition)
const flights = yield* pipe(
  People,
  byKey("russellwhyte"),
  trips,
  byKey(0),
  planItems,
  asFlight,
  fetchCollection(Flight)
)
```

## Query Options

Both service functions and path builders support OData query options:

```typescript
// With service functions
const products = yield* ProductService.getAll({
  $filter: "price gt 10",
  $orderby: "name",
  $top: 10,
  $select: "id,name,price"
})

// With path builders (via fetchCollection/fetchOne)
const myTrips = yield* pipe(
  People,
  byKey("russellwhyte"),
  trips,
  (path) => fetchCollection(Trip)(path, {
    $filter: "budget gt 1000",
    $orderby: "startsAt desc"
  })
)
```

## Type-Safe Query Building

Use the generated `QueryModels` for type-safe filter and orderby construction:

```typescript
import { productQuery } from "./generated"

const query = productQuery()
  .filter(q => q.price.gt(10).and(q.name.contains("Widget")))
  .orderBy(q => q.name.asc())
  .select("id", "name", "price")
  .top(10)
  .build()

const products = yield* ProductService.getAll(query)
```

## Promise-Based Usage

For non-Effect environments, use the `toPromise` function to convert any Effect to a Promise:

```typescript
import { pipe } from "effect"
import { createODataRuntime } from "@odata-effect/odata-effect-promise"
import { ProductService, toPromise, People, byKey, trips, fetchCollection, Trip } from "./generated"

const runtime = createODataRuntime({
  baseUrl: "https://api.example.com",
  servicePath: "/odata/v4/"
})

// Service functions - pipe through toPromise
const products = await ProductService.getAll().pipe(toPromise(runtime))
const product = await ProductService.getById(123).pipe(toPromise(runtime))

// Path builders - add toPromise at the end of the pipe
const myTrips = await pipe(
  People,
  byKey("russellwhyte"),
  trips,
  fetchCollection(Trip),
  toPromise(runtime)
)

// Don't forget to dispose when done
await runtime.dispose()
```

## Operations (Functions & Actions)

If your OData service defines FunctionImports (V2) or Functions/Actions (V4), they are generated in `Operations.ts`:

```typescript
import { Operations } from "./generated"

// V2 FunctionImport
const result = yield* Operations.getProductsByRating({ rating: 5 })

// V4 Function (no side effects)
const airport = yield* Operations.getNearestAirport({ lat: 51.5, lon: -0.1 })

// V4 Action (may have side effects)
yield* Operations.resetDataSource()
```

## License

MIT

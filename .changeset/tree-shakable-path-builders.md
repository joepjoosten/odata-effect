---
"@odata-effect/odata-effect-generator": minor
---

Add tree-shakable PathBuilders for type-safe OData navigation using pipe().

**New Features:**
- `PathBuilders.ts` - Generates branded path types and navigation functions
- Fully tree-shakable: each navigation function is a separate export
- Type-safe navigation enforced at compile time via branded `Path<TEntity, IsCollection>` type
- Support for entity inheritance with type casting functions (`asFlight`, `asEvent`, etc.)
- Terminal operations: `fetchCollection(Schema)` and `fetchOne(Schema)`
- Model suffix for type imports (`Person as PersonModel`) to avoid naming collisions

**Usage:**
```typescript
import { pipe } from "effect"
import { People, byKey, trips, planItems, asFlight, fetchCollection } from "./generated"
import { Flight } from "./generated"

const flights = yield* pipe(
  People,                    // Path<PersonModel, true>
  byKey("russellwhyte"),     // Path<PersonModel, false>
  trips,                     // Path<TripModel, true>
  byKey(0),                  // Path<TripModel, false>
  planItems,                 // Path<PlanItemModel, true>
  asFlight,                  // Path<FlightModel, true>
  fetchCollection(Flight)
)
```

**Breaking Change:** Replaces the previous object-based `*Navigation.ts` files with the new pipe-based `PathBuilders.ts` approach.

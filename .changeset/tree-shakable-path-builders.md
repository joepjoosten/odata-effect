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

**Usage:**
```typescript
import { pipe } from "effect"
import { people, byKey, trips, planItems, asFlight, fetchCollection } from "./generated"
import { Flight } from "./generated"

const flights = yield* pipe(
  people,                    // Path<Person, true>
  byKey("russellwhyte"),     // Path<Person, false>
  trips,                     // Path<Trip, true>
  byKey(0),                  // Path<Trip, false>
  planItems,                 // Path<PlanItem, true>
  asFlight,                  // Path<Flight, true>
  fetchCollection(Flight)
)
```

**Breaking Change:** Replaces the previous object-based `*Navigation.ts` files with the new pipe-based `PathBuilders.ts` approach.

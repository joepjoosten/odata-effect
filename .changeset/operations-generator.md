---
"@odata-effect/odata-effect-generator": minor
---

Add Operations.ts generation for unbound OData operations.

**New Features:**
- Generates `Operations.ts` for FunctionImports (V2) and unbound Functions/Actions (V4)
- Automatic parameter handling for functions with required/optional parameters
- Support for both POST (Actions) and GET (Functions) HTTP methods
- Only generated when the service defines unbound operations

**Usage:**
```typescript
import { Operations } from "./generated"

// V4 Function (GET, no side effects)
const airport = yield* Operations.getNearestAirport({ lat: 51.5, lon: -0.1 })

// V4 Action (POST, may have side effects)
yield* Operations.resetDataSource()

// V2 FunctionImport
const products = yield* Operations.getProductsByRating({ rating: 5 })
```

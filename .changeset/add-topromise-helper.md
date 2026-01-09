---
"@odata-effect/odata-effect-promise": minor
"@odata-effect/odata-effect-generator": patch
---

Add `toPromise` helper for composable Effect-to-Promise conversion

**@odata-effect/odata-effect-promise:**
- Add `toPromise(runtime)` function that can be used at the end of any pipe chain
- Export directly from the main entry point for convenience
- Works with any Effect-based OData operation

**@odata-effect/odata-effect-generator:**
- PathBuilders now import and re-export `toPromise` from `@odata-effect/odata-effect-promise`
- Reduces generated code duplication

Usage:
```typescript
import { pipe } from "effect"
import { OData } from "@odata-effect/odata-effect"
import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"

const runtime = createODataRuntime({ baseUrl: "...", servicePath: "..." })

// Use with any Effect
const product = await pipe(
  OData.get("Products('1')", ProductSchema),
  toPromise(runtime)
)

// Use with generated services
const products = await pipe(
  ProductService.getAll(),
  toPromise(runtime)
)
```

# @odata-effect/odata-effect

Effect-based OData client infrastructure for SAP OData V2/V4 services.

## Installation

```bash
npm install @odata-effect/odata-effect
# or
pnpm add @odata-effect/odata-effect
```

## Features

- Type-safe OData V2 and V4 client
- Effect-based error handling
- Query builder with type-safe paths
- Batch request support
- Media entity operations
- SAP-specific error handling

## Usage

```typescript
import { OData } from "@odata-effect/odata-effect"
import * as Effect from "effect/Effect"

const result = Effect.gen(function* () {
  const products = yield* OData.get("/Products")
  return products
})
```

## License

MIT

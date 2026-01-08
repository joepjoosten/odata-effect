# odata-effect

Effect-based OData client library for SAP OData V2/V4 services.

## Packages

| Package | Description |
|---------|-------------|
| [@odata-effect/odata-effect](./packages/odata-effect) | Core OData client infrastructure |
| [@odata-effect/odata-effect-promise](./packages/odata-effect-promise) | Promise-based wrapper for non-Effect environments |
| [@odata-effect/odata-effect-generator](./packages/odata-effect-generator) | Code generator for type-safe service clients |

## Installation

```bash
# Core package (Effect-based)
pnpm add @odata-effect/odata-effect

# Promise-based wrapper
pnpm add @odata-effect/odata-effect-promise

# Code generator (CLI)
pnpm add -g @odata-effect/odata-effect-generator
```

## Quick Start

### With Effect

```typescript
import { OData } from "@odata-effect/odata-effect"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"

const program = Effect.gen(function* () {
  const products = yield* OData.get("/Products")
  return products
})

const MainLive = Layer.merge(
  OData.ODataClientLive,
  OData.HttpClientLive
)

Effect.runPromise(program.pipe(Effect.provide(MainLive)))
```

### With Promises

```typescript
import { createODataRuntime } from "@odata-effect/odata-effect-promise"
import * as OData from "@odata-effect/odata-effect-promise/v2"

const runtime = createODataRuntime({
  baseUrl: "https://api.example.com/odata"
})

const products = await OData.get(runtime, "/Products")
```

### Generate Type-Safe Clients

```bash
odata-effect-gen --metadata ./metadata.xml --output ./generated
```

## Features

- Type-safe OData V2 and V4 clients
- Effect-based error handling with detailed error types
- Query builder with type-safe filtering and ordering
- Batch request support
- Media entity operations (upload/download)
- SAP-specific error handling
- Promise wrapper for non-Effect environments
- Code generator for type-safe service clients

## Development

```bash
# Install dependencies
pnpm install

# Type check
pnpm check

# Run tests
pnpm test

# Build all packages
pnpm build
```

## License

MIT

# @odata-effect/odata-effect-promise

Promise-based OData client for non-Effect environments. Wraps the core `@odata-effect/odata-effect` package with a Promise-based API.

## Installation

```bash
npm install @odata-effect/odata-effect-promise
# or
pnpm add @odata-effect/odata-effect-promise
```

## Usage

```typescript
import { createODataRuntime } from "@odata-effect/odata-effect-promise"
import * as OData from "@odata-effect/odata-effect-promise/v2"

const runtime = createODataRuntime({
  baseUrl: "https://api.example.com/odata",
  headers: {
    Authorization: "Bearer token"
  }
})

const products = await OData.get(runtime, "/Products")
```

## License

MIT

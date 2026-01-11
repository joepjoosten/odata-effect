---
"@odata-effect/odata-effect": minor
"@odata-effect/odata-effect-promise": major
---

Unified ODataClientConfig for V2 and V4, platform-independent HTTP client

### @odata-effect/odata-effect

- Added `Config` module with unified `ODataClientConfig` context tag
- V2 and V4 now share the same configuration (`ODataClientConfig`)
- Removed `ODataV4ClientConfig` and `ODataV4ClientConfigService` (use `ODataClientConfig` and `ODataClientConfigService` instead)

### @odata-effect/odata-effect-promise

**Breaking Changes:**

- `createODataRuntime` now requires an `httpClientLayer` parameter for platform independence
- Removed `createODataV4Runtime` (use `createODataRuntime` for both V2 and V4)
- Removed `ODataV4Runtime` type (use `ODataRuntime` for both V2 and V4)
- Removed `@effect/platform-node` from dependencies (users must provide their own HTTP client layer)

**Migration:**

Before:
```typescript
import { createODataRuntime } from "@odata-effect/odata-effect-promise"

const runtime = createODataRuntime({
  baseUrl: "https://server.com",
  servicePath: "/odata/"
})
```

After:
```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { createODataRuntime } from "@odata-effect/odata-effect-promise"

const runtime = createODataRuntime(
  { baseUrl: "https://server.com", servicePath: "/odata/" },
  NodeHttpClient.layer
)
```

For Bun:
```typescript
import * as BunHttpClient from "@effect/platform-bun/BunHttpClient"
import { createODataRuntime } from "@odata-effect/odata-effect-promise"

const runtime = createODataRuntime(
  { baseUrl: "https://server.com", servicePath: "/odata/" },
  BunHttpClient.layer
)
```

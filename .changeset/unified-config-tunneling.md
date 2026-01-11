---
"@odata-effect/odata-effect": minor
"@odata-effect/odata-effect-promise": major
---

Unified ODataClientConfig, platform-independent HTTP client, and request tunneling support

### @odata-effect/odata-effect

- Added `Config` module with unified `ODataClientConfig` context tag
- V2 and V4 now share the same configuration (`ODataClientConfig`)
- Removed `ODataV4ClientConfig` and `ODataV4ClientConfigService` (use `ODataClientConfig` and `ODataClientConfigService` instead)
- Added `useTunneling` option to tunnel PUT, PATCH, and DELETE requests via POST using the X-HTTP-Method header

**Request Tunneling:**

When `useTunneling: true` is set in the config, PUT, PATCH, and DELETE requests are sent as POST requests with the `X-HTTP-Method` header. This is useful when firewalls or proxies block these HTTP methods.

```typescript
const config = {
  baseUrl: "https://server.com",
  servicePath: "/odata/",
  useTunneling: true  // PUT/PATCH/DELETE will use POST with X-HTTP-Method header
}
```

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

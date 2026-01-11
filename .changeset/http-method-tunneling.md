---
"@odata-effect/odata-effect": minor
---

Add HTTP method tunneling support via X-HTTP-Method header

Added `useTunneling` option to `ODataClientConfigService`. When enabled, PUT, PATCH, and DELETE requests are tunneled via POST using the `X-HTTP-Method` header. This is useful when firewalls or proxies block these HTTP methods.

```typescript
const config = {
  baseUrl: "https://server.com",
  servicePath: "/odata/",
  useTunneling: true
}
```

When `useTunneling: true`:
- **V2**: DELETE uses POST with `X-HTTP-Method: DELETE` (PATCH already uses POST with `X-Http-Method: MERGE`)
- **V4**: PATCH uses POST with `X-HTTP-Method: PATCH`, PUT uses POST with `X-HTTP-Method: PUT`, DELETE uses POST with `X-HTTP-Method: DELETE`

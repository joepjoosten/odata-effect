# @odata-effect/odata-effect

Core Effect-based OData client infrastructure for SAP OData V2 and V4 services.

Use this package directly when you already write Effect programs, need low-level OData operations, or want to build your own generated/client layer. If you mainly want a typed client from service metadata, start with `@odata-effect/odata-effect-generator`.

## Install

For Node.js:

```bash
pnpm add @odata-effect/odata-effect effect@4.0.0-beta.74 @effect/platform-node@4.0.0-beta.74
```

The core package is platform-independent. Node.js users normally provide `@effect/platform-node/NodeHttpClient`. Bun or browser users provide the matching Effect HTTP client layer for that runtime.

## First Request

Every request needs three things:

| Item | Example | Notes |
| ---- | ------- | ----- |
| `baseUrl` | `https://server.example.com` | Protocol and host only. |
| `servicePath` | `/sap/opu/odata/sap/MY_SERVICE/` | OData service root, usually with a trailing slash. |
| operation path | `Products` or `Products('123')` | Relative to `servicePath`; usually no leading slash. |
| schema | `Schema.Struct(...)` | Used to decode and validate the response body. |

```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { Config, OData } from "@odata-effect/odata-effect"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"

const Product = Schema.Struct({
  ProductID: Schema.String,
  Name: Schema.String
})

const Live = Layer.merge(
  Layer.succeed(Config.ODataClientConfig, {
    baseUrl: "https://server.example.com",
    servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
  }),
  NodeHttpClient.layer
)

const program = OData.getCollection("Products", Product, { $top: 10 })

const products = await Effect.runPromise(program.pipe(Effect.provide(Live)))
```

Use `ODataV4` for V4 services:

```typescript
import { ODataV4 } from "@odata-effect/odata-effect"

const product = await Effect.runPromise(
  ODataV4.get("Products(1)", Product).pipe(Effect.provide(Live))
)
```

## Main Modules

| Module | Purpose |
| ------ | ------- |
| `Config` | Provides `ODataClientConfig`, the service configuration context. |
| `OData` | V2 operations such as `get`, `getCollection`, `post`, `patch`, and `del`. |
| `ODataV4` | V4 operations and V4 response handling. |
| `ODataSchema` | OData wire-format schemas for V2/V4 date, time, duration, decimal, and Int64 values. |
| `Crud` / `CrudV4` | Factories for entity-set CRUD services. |
| `QueryBuilder` | Type-safe filter, select, expand, nested expanding, orderby, top, and skip helpers. |
| `Batch` | V2 multipart batch and V4 multipart/JSON batch support. |
| `Media` | Media entity download, stream, upload, update, and delete helpers. |
| `Operations` | Function imports, functions, and actions. |

## Query Options

```typescript
const products = await Effect.runPromise(
  OData.getCollection("Products", Product, {
    $filter: "Name eq 'Notebook'",
    $select: "ProductID,Name",
    $orderby: "Name asc",
    $top: 20
  }).pipe(Effect.provide(Live))
)
```

V4 additionally supports `$count`, `$search`, `$compute`, and `$apply` through `ODataV4` query options.

## Type-Safe Query Builder

Generated query models use `QueryBuilder` so query options can be built from TypeScript property names while still emitting OData path names:

```typescript
import { personQuery } from "./generated/index.js"

const query = personQuery()
  .select("userName")
  .expanding("trips", (trips, qTrip) =>
    trips
      .select("description", "budget")
      .filter(qTrip.budget.gt(1000))
      .orderBy(qTrip.startsAt.desc())
      .top(5)
  )
  .build()
```

`expanding` derives the nested builder from the generated navigation path, so `trips` is typed as the expanded trip model. The resulting `$expand` uses inline nested options such as `Trips($select=Description,Budget;$filter=Budget gt 1000)`.

## Writes

```typescript
const EditableProduct = Schema.Struct({
  Name: Schema.String
})

const created = await Effect.runPromise(
  OData.post("Products", { Name: "Notebook" }, EditableProduct, Product).pipe(Effect.provide(Live))
)

await Effect.runPromise(
  OData.patch("Products('123')", { Name: "Updated" }, EditableProduct, { forceUpdate: true }).pipe(
    Effect.provide(Live)
  )
)
```

For OData V2, `patch` uses `POST` with `X-Http-Method: MERGE`. Set `useTunneling: true` in `ODataClientConfig` when your infrastructure requires method tunneling for writes/deletes.

## Generated Clients

The core package is what generated clients call under the hood. A generated `ProductService` is essentially a typed wrapper around `OData.getCollection`, `OData.get`, `OData.post`, `OData.patch`, and `OData.del`.

## License

MIT

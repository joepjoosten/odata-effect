# @odata-effect/odata-effect-promise

Promise bridge for `@odata-effect/odata-effect`.

The core OData operations and generated services return Effect values. This package gives Promise-based apps a small runtime and a `toPromise(runtime)` helper so you can use those operations from scripts, Express, Next.js route handlers, tests, and other non-Effect entry points.

## Install

For Node.js:

```bash
pnpm add @odata-effect/odata-effect @odata-effect/odata-effect-promise effect@4.0.0-beta.74 @effect/platform-node@4.0.0-beta.74
```

The runtime is platform-independent. Node.js examples use `@effect/platform-node/NodeHttpClient`; Bun or browser apps should provide the matching Effect HTTP client layer.

## Create A Runtime

```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { createODataRuntime } from "@odata-effect/odata-effect-promise"

const runtime = createODataRuntime(
  {
    baseUrl: "https://server.example.com",
    servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
  },
  NodeHttpClient.layer
)
```

`baseUrl` is the protocol and host. `servicePath` is the OData service root and should usually end with `/`.

Always dispose the runtime when your process, request scope, or test is done:

```typescript
try {
  // run OData operations here
} finally {
  await runtime.dispose()
}
```

## Use Generated Services

This is the most common usage. Generate a client with `@odata-effect/odata-effect-generator`, then convert generated service Effects to Promises:

```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
import { ProductService } from "./generated/index.js"

const runtime = createODataRuntime(
  {
    baseUrl: "https://server.example.com",
    servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
  },
  NodeHttpClient.layer
)

try {
  const products = await ProductService.getAll({ $top: 10 }).pipe(toPromise(runtime))
  const product = await ProductService.getById("123").pipe(toPromise(runtime))
  const created = await ProductService.create({ name: "Notebook" }).pipe(toPromise(runtime))

  console.log({ created, product, products })
} finally {
  await runtime.dispose()
}
```

## Use Core Operations Directly

You can also use the low-level V2 and V4 modules from `@odata-effect/odata-effect`:

```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { OData, ODataV4 } from "@odata-effect/odata-effect"
import { createODataRuntime, toPromise } from "@odata-effect/odata-effect-promise"
import * as Schema from "effect/Schema"

const Product = Schema.Struct({
  ProductID: Schema.String,
  Name: Schema.String
})

const runtime = createODataRuntime(
  {
    baseUrl: "https://server.example.com",
    servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
  },
  NodeHttpClient.layer
)

try {
  const v2Products = await OData.getCollection("Products", Product, { $top: 10 }).pipe(toPromise(runtime))
  const v4Product = await ODataV4.get("Products(1)", Product).pipe(toPromise(runtime))

  console.log({ v2Products, v4Product })
} finally {
  await runtime.dispose()
}
```

## Handling Errors

`toPromise(runtime)` rejects when the underlying Effect fails. Use normal `try`/`catch` at the Promise boundary:

```typescript
try {
  const products = await ProductService.getAll().pipe(toPromise(runtime))
  console.log(products)
} catch (error) {
  console.error("OData request failed", error)
}
```

If you want Effect's `Exit` value instead of thrown Promise rejections, use `runtime.runPromiseExit(effect)`.

## API

| Export | Description |
| ------ | ----------- |
| `createODataRuntime(config, httpClientLayer)` | Creates a managed runtime with OData config and an HTTP client layer. |
| `toPromise(runtime)` | Converts an Effect operation into a Promise. Designed for `.pipe(toPromise(runtime))`. |
| `ODataRuntime` | Runtime interface with `runPromise`, `runPromiseExit`, and `dispose`. |

## License

MIT

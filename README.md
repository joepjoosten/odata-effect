# odata-effect

Effect-based OData clients for SAP OData V2 and V4 services.

The usual workflow is:

1. Download your service metadata XML.
2. Generate a typed client from that metadata.
3. Run the generated Effect operations directly, or convert them to Promises.

## Packages

| Package | Use it when |
| ------- | ----------- |
| [@odata-effect/odata-effect](./packages/odata-effect) | You write Effect code directly or need low-level OData helpers. |
| [@odata-effect/odata-effect-generator](./packages/odata-effect-generator) | You want generated schemas, services, path builders, and operations from `$metadata`. |
| [@odata-effect/odata-effect-promise](./packages/odata-effect-promise) | You want to call generated or core Effect operations from Promise-based code. |

## Install

For a Node.js app using generated clients:

```bash
pnpm add @odata-effect/odata-effect @odata-effect/odata-effect-promise effect@4.0.0-beta.74 @effect/platform-node@4.0.0-beta.74
pnpm add -D @odata-effect/odata-effect-generator
```

Use `npm install` or `yarn add` instead if your project does not use pnpm.

## Quick Start: Generate A Client

Download your OData metadata document:

```bash
curl 'https://server.example.com/sap/opu/odata/sap/MY_SERVICE/$metadata' -o metadata.xml
```

Generate TypeScript files into your app:

```bash
pnpm exec odata-effect-gen generate ./metadata.xml ./src/generated --files-only --force --config '{"esmExtensions": true}'
```

Call a generated service from Promise-based application code:

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
  console.log(products)
} finally {
  await runtime.dispose()
}
```

`baseUrl` is the protocol and host. `servicePath` is the OData service root and should usually end with `/`. Operation paths are relative to that service root, for example `Products` or `Products('123')`.

## Manual Client Usage

Use the core package directly when you do not want code generation.

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

For OData V4 services, use `ODataV4` instead of `OData`.

## Common Tasks

| Task | Start here |
| ---- | ---------- |
| Generate a client from metadata | [@odata-effect/odata-effect-generator](./packages/odata-effect-generator) |
| Call generated services from an Express, Next.js, or script-style app | [@odata-effect/odata-effect-promise](./packages/odata-effect-promise) |
| Write custom Effect programs against OData | [@odata-effect/odata-effect](./packages/odata-effect) |
| Build type-safe filters and query options | Generated `QueryModels.ts` or `QueryBuilder` in the core package |
| Work with V2 date, decimal, Int64, or duration wire formats | `ODataSchema` in the core package |

## Development

```bash
pnpm install
pnpm codegen
pnpm check
pnpm test -- --run
pnpm build
```

## License

MIT

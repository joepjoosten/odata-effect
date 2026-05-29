# @odata-effect/odata-effect-generator

Code generator for Effect-based OData service clients. It reads an OData `$metadata` XML file and generates TypeScript schemas, CRUD services, path builders, query helpers, and operations.

This is the recommended starting point for a new project because it turns service metadata into typed code.

## Install

Install it in the app or workspace where you want to generate code:

```bash
pnpm add -D @odata-effect/odata-effect-generator
pnpm add @odata-effect/odata-effect @odata-effect/odata-effect-promise effect@4.0.0-beta.74 @effect/platform-node@4.0.0-beta.74
```

## Step 1: Download Metadata

Save your service metadata as XML:

```bash
curl 'https://server.example.com/sap/opu/odata/sap/MY_SERVICE/$metadata' -o metadata.xml
```

If the endpoint needs authentication, download the same `$metadata` document using your normal authenticated HTTP client and save it locally.

## Step 2: Generate Code

Generate files directly into an existing app:

```bash
pnpm exec odata-effect-gen generate ./metadata.xml ./src/generated --files-only --force --config '{"esmExtensions": true}'
```

Generate a package-style folder instead:

```bash
pnpm exec odata-effect-gen generate ./metadata.xml ./packages/my-service-client --package-name @my-org/my-service-client --force
```

Use `--files-only` for application source folders. Omit it when you want the generator to create package files such as `package.json`, `tsconfig`, and `vitest.config`. Package-style output is intended for workspace layouts where the generated package can share the repository's TypeScript and build configuration.

## Step 3: Call The Generated Client

Promise-style application code:

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
  console.log({ product, products })
} finally {
  await runtime.dispose()
}
```

Effect-style code:

```typescript
import * as NodeHttpClient from "@effect/platform-node/NodeHttpClient"
import { Config } from "@odata-effect/odata-effect"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { ProductService } from "./generated/index.js"

const Live = Layer.merge(
  Layer.succeed(Config.ODataClientConfig, {
    baseUrl: "https://server.example.com",
    servicePath: "/sap/opu/odata/sap/MY_SERVICE/"
  }),
  NodeHttpClient.layer
)

const program = ProductService.getAll({ $top: 10 })
const products = await Effect.runPromise(program.pipe(Effect.provide(Live)))
```

Generated service names are based on entity set names. For example, an entity set named `Products` becomes `ProductService`.

Generated models use TypeScript-style property names such as `name` or `productID`. The generated schemas handle encoding and decoding the original OData property names for you.

## Generated Files

| File | Description |
| ---- | ----------- |
| `Models.ts` | Effect Schema values for entities, complex types, enums, and editable variants. |
| `QueryModels.ts` | Type-safe query builders for filter, select, orderby, top, and skip. |
| `Services.ts` | CRUD services for entity sets. |
| `PathBuilders.ts` | Tree-shakable navigation path builders with terminal fetch helpers. |
| `Operations.ts` | Function imports, V4 functions, and V4 actions when present in metadata. |
| `index.ts` | Re-exports the generated API. |

## Service Functions

Use generated services for normal CRUD operations:

```typescript
const products = await ProductService.getAll({ $top: 10 }).pipe(toPromise(runtime))
const product = await ProductService.getById("123").pipe(toPromise(runtime))
const created = await ProductService.create({ name: "Notebook" }).pipe(toPromise(runtime))
await ProductService.update("123", { name: "Updated" }).pipe(toPromise(runtime))
await ProductService.delete("123").pipe(toPromise(runtime))
```

## Path Builders

Use path builders when you need typed navigation across relationships:

```typescript
import { pipe } from "effect/Function"
import { Flight, People, byKey, fetchCollection, planItems, trips } from "./generated/index.js"

const flights = await pipe(
  People,
  byKey("russellwhyte"),
  trips,
  byKey(0),
  planItems,
  fetchCollection(Flight),
  toPromise(runtime)
)
```

The path type tracks both the current entity type and whether the path is a collection, so TypeScript rejects invalid navigation.

## Type-Safe Queries

Use generated query models instead of hand-written query strings when possible:

```typescript
import { productQuery } from "./generated/index.js"

const query = productQuery()
  .filter((q) => q.name.contains("Notebook"))
  .orderBy((q) => q.name.asc())
  .select("productID", "name")
  .top(10)
  .build()

const products = await ProductService.getAll(query).pipe(toPromise(runtime))
```

## Operations

If the metadata contains FunctionImports, Functions, or Actions, they are exported from `Operations.ts`:

```typescript
import { Operations } from "./generated/index.js"

const result = await Operations.getProductsByRating({ rating: 5 }).pipe(toPromise(runtime))
await Operations.resetDataSource().pipe(toPromise(runtime))
```

## CLI Reference

```bash
odata-effect-gen generate <metadata-path> <output-dir> [options]
```

| Option | Description |
| ------ | ----------- |
| `--service-name <name>` | Override the service name. Defaults to the EntityContainer name. |
| `--package-name <name>` | Package name for package-style workspace generation. |
| `--force` | Overwrite existing files. |
| `--files-only` | Generate only source files directly into `output-dir`. |
| `--config <json-or-path>` | JSON string or path to JSON config. Supports `esmExtensions` and naming `overrides`. |

Example config file:

```json
{
  "esmExtensions": true,
  "overrides": {
    "properties": {
      "ID": "id",
      "SKU": "sku"
    },
    "entities": {
      "BusinessPartner": {
        "name": "Partner"
      }
    }
  }
}
```

Run with:

```bash
pnpm exec odata-effect-gen generate ./metadata.xml ./src/generated --files-only --config ./odata-effect.config.json
```

## Troubleshooting

| Problem | What to check |
| ------- | ------------- |
| Generated imports fail in Node ESM | Use `--config '{"esmExtensions": true}'`. |
| `ProductService` does not exist | Check the entity set name in metadata; service names are singularized from entity sets. |
| Request URL is wrong | `baseUrl` should be host only; `servicePath` should be the OData service root; generated paths are relative. |
| Metadata download fails | Download `$metadata` with the same authentication method your SAP service requires. |

## License

MIT

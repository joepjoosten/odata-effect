---
"@odata-effect/odata-effect-generator": minor
---

Add property name mapping with Schema.fromKey for OData V2 compatibility

OData V2 responses use PascalCase property names (e.g., `ID`, `ReleaseDate`), but the generator converts them to camelCase for TypeScript (e.g., `id`, `releaseDate`). This caused schema validation failures because the decoded property names didn't match the JSON.

**Schema.fromKey Mapping:**

Generated schemas now use `Schema.propertySignature` with `Schema.fromKey` to map between encoded (PascalCase) and decoded (camelCase) property names:

```typescript
// Before (caused validation errors with OData V2 responses)
export class Product extends Schema.Class<Product>("Product")({
  id: Schema.Number,
  productName: Schema.String,
})

// After (correctly maps OData property names)
export class Product extends Schema.Class<Product>("Product")({
  id: Schema.propertySignature(Schema.Number).pipe(Schema.fromKey("ID")),
  productName: Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ProductName")),
})
```

**Custom Name Overrides:**

Added support for custom property and type name overrides via a JSON config file:

```bash
odata-effect-gen generate metadata.xml ./output --config odata-effect.config.json
```

Config file format:
```json
{
  "overrides": {
    "properties": {
      "ID": "id",
      "SKU": "sku"
    },
    "entities": {
      "Product": {
        "name": "Product",
        "properties": {
          "ProductID": "productId"
        }
      }
    },
    "complexTypes": {
      "Address": {
        "properties": {
          "ZIPCode": "zipCode"
        }
      }
    },
    "operations": {
      "GetProductsByRating": {
        "name": "fetchProductsByRating",
        "parameters": {
          "rating": "minRating"
        }
      }
    }
  }
}
```

This allows:
- Global property name overrides (e.g., `ID` → `id` instead of `iD`)
- Entity-specific property overrides
- Complex type-specific property overrides
- Type name overrides
- Operation name overrides (function imports, functions, actions)
- Operation parameter name overrides

**QueryModels Integration:**

The NamingOverrides also flow through to QueryModels generation. Query interfaces use TypeScript names while path constructors use OData names:

```typescript
// Generated QueryModels.ts
export interface QProduct {
  readonly id: NumberPath           // TypeScript name from override
  readonly productName: StringPath  // TypeScript name from override
}

export const qProduct: QProduct = {
  id: new NumberPath("ID"),                // OData name for queries
  productName: new StringPath("ProductName")  // OData name for queries
}
```

This ensures type-safe query building with proper OData protocol compatibility.

**Operations Integration:**

Operations (function imports, functions, actions) also support naming overrides and proper name mapping:

```typescript
// Generated Operations.ts
export interface GetProductsByRatingParams {
  readonly minRating: number  // TypeScript name from override
}

export const fetchProductsByRating = (
  params: GetProductsByRatingParams
): Effect.Effect<...> =>
  Effect.gen(function*() {
    const parameters: ODataOps.OperationParameters = {
      "rating": params.minRating,  // Maps to OData parameter name
    }
    // ...
  })
```

This ensures TypeScript code uses friendly names while OData API calls use the correct protocol names.

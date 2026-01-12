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
    }
  }
}
```

This allows:
- Global property name overrides (e.g., `ID` → `id` instead of `iD`)
- Entity-specific property overrides
- Complex type-specific property overrides
- Type name overrides

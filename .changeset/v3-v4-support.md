---
"@odata-effect/odata-effect": patch
"@odata-effect/odata-effect-generator": patch
---

Fix bugs from demo feedback:

**@odata-effect/odata-effect:**
- Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
- Add support for OData V3/V4 response format `{ value: [...] }` with automatic runtime detection
- Fix numeric key handling in V2 URLs (no longer quoted as strings)
- Update EntityKey type to support string, number, and boolean key values
- Add DateTime.DateTime and BigDecimal.BigDecimal type support in QueryBuilder FieldToPath mapping

**@odata-effect/odata-effect-generator:**
- Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
- Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts
- Remove unused Effect import from generated PathBuilders.ts
- Fix Edm.Decimal queryPath to use NumberPath for numeric comparisons in OData queries

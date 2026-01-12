---
"@odata-effect/odata-effect": patch
"@odata-effect/odata-effect-generator": patch
---

Fix 6 bugs from demo feedback:

**@odata-effect/odata-effect:**
- Add support for V2 legacy response format `{ d: [...] }` in addition to standard `{ d: { results: [...] } }`
- Fix numeric key handling in V2 URLs (no longer quoted as strings)
- Add DateTime.DateTime type support in QueryBuilder FieldToPath mapping

**@odata-effect/odata-effect-generator:**
- Fix Schema.propertySignature usage for optional fields with fromKey (optionalWith already returns PropertySignature)
- Remove unused DateTime/BigDecimal/Duration imports from generated Models.ts

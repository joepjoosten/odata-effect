---
"@odata-effect/odata-effect-generator": patch
---

- Fix: Generated Operations.ts now correctly imports Schema and ODataSchema when operations use DateTime, BigDecimal, or other special types
- Simplify generated fromKey mappings: use `Schema.String.pipe(Schema.fromKey("ID"))` instead of `Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))`
- Simplify generated optional fields: use `Schema.NullishOr(Schema.String)` instead of `Schema.optionalWith(Schema.String, { nullable: true })`

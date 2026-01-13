---
"@odata-effect/odata-effect-generator": patch
---

- Fix: Generated Operations.ts now correctly imports only required modules:
  - `Schema` when return types use primitive schema types (not for parameters)
  - `ODataSchema` when return types use OData-specific schemas (not for parameters)
  - `DateTime` when parameters/returns use `DateTime.DateTime.Utc` or `DateTime.DateTime.Zoned`
  - `Duration` when parameters/returns use `Duration.Duration`
  - `BigDecimal` when parameters/returns use `BigDecimal.BigDecimal`
- Simplify generated fromKey mappings: use `Schema.String.pipe(Schema.fromKey("ID"))` instead of `Schema.propertySignature(Schema.String).pipe(Schema.fromKey("ID"))`
- Simplify generated optional fields: use `Schema.NullishOr(Schema.String)` instead of `Schema.optionalWith(Schema.String, { nullable: true })`

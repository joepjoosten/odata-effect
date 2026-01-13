---
"@odata-effect/odata-effect-generator": patch
---

- Fix: Generated Operations.ts now correctly imports only required modules:
  - `Schema` when return types use primitive schema types (not for parameters)
  - `ODataSchema` when return types use OData-specific schemas, or parameters use `ODataSchema.Int64`
  - `DateTime` when parameters/returns use `DateTime.Utc` or `DateTime.Zoned`
  - `Duration` when parameters/returns use `Duration.Duration`
  - `BigDecimal` when parameters/returns use `BigDecimal.BigDecimal`
- Fix: DateTime types now correctly generate as `DateTime.Utc` and `DateTime.Zoned` instead of `DateTime.DateTime.Utc` and `DateTime.DateTime.Zoned`
- Fix: Generated Models.ts now wraps ODataSchema types with `Schema.asSchema()` when used with `Schema.propertySignature` to satisfy TypeScript's `Schema.All` constraint
- Change: `Edm.Int64` now generates as `ODataSchema.Int64` type (branded Int64) instead of `BigDecimal.BigDecimal`
- Change: QueryPath mappings updated for Effect types:
  - `Edm.Int64` → `Int64Path`
  - `Edm.Decimal` → `BigDecimalPath`
  - `Edm.Time` (V2) → `DurationPath`
  - `Edm.Duration` (V4) → `DurationPath`

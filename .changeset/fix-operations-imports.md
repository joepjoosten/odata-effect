---
"@odata-effect/odata-effect-generator": patch
---

Fix OperationsGenerator using incorrect module paths

The OperationsGenerator was importing from the old module paths (`ODataClient` and `ODataV4Client`) which were renamed to `OData` and `ODataV4`. This caused TypeScript to fail type inference, resulting in generated operations returning `Effect<T, unknown, unknown>` instead of the proper error and context types.

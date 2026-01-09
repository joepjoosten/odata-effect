---
"@odata-effect/odata-effect": patch
---

Support optional parameters in OData operations

Added `undefined` to the `OperationParameters` type and filter out undefined values when building function import URLs. This allows callers to pass optional parameters that are excluded from the generated URL when not provided.

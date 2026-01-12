---
"@odata-effect/odata-effect-generator": patch
"@odata-effect/odata-effect": patch
---

**@odata-effect/odata-effect-generator:**
- Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability

**@odata-effect/odata-effect:**
- Add ODataClientError and ODataClientDependencies type aliases for declaration portability
- Add ODataV4ClientError and ODataV4ClientDependencies type aliases for declaration portability
- Add support for OData V3 single entity response format (entity at root with odata.metadata) in get, getComplex, expandDeferred, post, and executeFunctionImportEntity
- Add ISO 8601 datetime format support to ODataV2DateTime and ODataV2DateTimeOffset schemas for V3 compatibility

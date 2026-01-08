---
"@odata-effect/odata-effect-generator": patch
---

Fix generated service imports to use subpath imports instead of main package exports. The generated code now correctly imports from `@odata-effect/odata-effect/ODataClient`, `@odata-effect/odata-effect/ODataV4Client`, `@odata-effect/odata-effect/OData`, `@odata-effect/odata-effect/ODataV4`, and `@odata-effect/odata-effect/Errors` for proper tree-shaking support.

Also fixed CLI documentation to show correct usage: `odata-effect-gen generate <metadata-path> <output-dir>`

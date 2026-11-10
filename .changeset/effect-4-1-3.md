---
"@odata-effect/odata-effect": patch
"@odata-effect/odata-effect-generator": patch
"@odata-effect/odata-effect-promise": patch
---

Update Effect and the associated platform and test packages to 4.1.3.
This pulls in `undici` 8.12.4 through `@effect/platform-node`, which resolves the open high-severity advisories in the generator's runtime dependencies.
Generated packages use Effect 4.1.3 and require the matching core and promise releases.

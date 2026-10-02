---
"@odata-effect/odata-effect": patch
"@odata-effect/odata-effect-generator": patch
"@odata-effect/odata-effect-promise": patch
---

Update Effect and the associated platform and test packages to the stable 4.0.0 release.
Effect 4.0.0 promotes the former `effect/unstable/*` modules, so imports now use `effect/http` and `effect/cli`.
Generated packages use Effect 4.0.0 and require the matching core and promise releases.

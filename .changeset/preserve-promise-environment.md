---
"@odata-effect/odata-effect-promise": patch
---

Constrain toPromise to the services provided by ODataRuntime. Effects requiring application services must provide them before conversion, so missing dependencies now produce a compile-time error instead of a runtime defect.

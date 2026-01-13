---
"@odata-effect/odata-effect-generator": patch
---

**@odata-effect/odata-effect-generator:**
- Add explicit return type annotations to generated fetchCollection and fetchOne functions for TypeScript declaration portability
- CLI: `--config` now accepts JSON string directly (e.g., `--config '{"esmExtensions": true}'`) or a file path
- Change default for `esmExtensions` from `true` to `false`

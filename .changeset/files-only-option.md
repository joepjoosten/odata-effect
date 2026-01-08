---
"@odata-effect/odata-effect-generator": minor
---

Add `--files-only` option to generate only source files without project configuration files (package.json, tsconfig, etc.). When enabled, files are output directly to the output directory instead of a src/ subdirectory.

Also fixed:
- Removed unnecessary re-exports from @odata-effect/odata-effect in generated index.ts
- Removed `.js` extensions from local imports in generated files
- Fixed QueryModels.ts to use subpath import for QueryBuilder

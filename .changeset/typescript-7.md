---
"@odata-effect/odata-effect-generator": patch
---

Generated packages now use TypeScript 7 (`typescript@^7.0.2`) for their `check` and `build` scripts.
The generated `tsconfig` files already avoid the options TypeScript 7 removed, so no other changes are needed.

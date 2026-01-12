---
"@odata-effect/odata-effect-generator": minor
---

Add configurable `.js` extensions for generated imports (ESM compatibility)

Generated files now include `.js` extensions on relative imports by default, enabling compatibility with:
- `moduleResolution: node16` / `nodenext`
- Native Node.js ESM (no bundler)

The `esmExtensions` option can be used to control this behavior:

```typescript
import { generate } from "@odata-effect/odata-effect-generator"

// Default: with .js extensions (ESM compatible)
generate(dataModel, { outputDir: "./output" })
// Generated: import { Product } from "./Models.js"

// Opt-out for bundler setups
generate(dataModel, { outputDir: "./output", esmExtensions: false })
// Generated: import { Product } from "./Models"
```

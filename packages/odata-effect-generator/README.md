# @odata-effect/odata-effect-generator

Code generator for Effect-based OData service clients. Generates type-safe TypeScript code from OData metadata.

## Installation

```bash
npm install -g @odata-effect/odata-effect-generator
# or
pnpm add -g @odata-effect/odata-effect-generator
```

## Usage

```bash
odata-effect-gen --metadata ./metadata.xml --output ./generated
```

### Options

- `--metadata, -m`: Path to OData metadata XML file (required)
- `--output, -o`: Output directory for generated code (required)
- `--package, -p`: NPM package name (optional)

## Generated Code

The generator produces:

- `Models.ts` - Schema classes for entities and complex types
- `QueryModels.ts` - Type-safe query paths for filtering and ordering
- `*Service.ts` - Effect-based service functions for each entity set
- `*ServicePromise.ts` - Promise-based service functions
- `index.ts` - Re-exports all generated code

## License

MIT

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
odata-effect-gen generate ./metadata.xml ./generated
```

### Arguments

- `<metadata-path>`: Path to OData metadata XML file (required)
- `<output-dir>`: Output directory for generated code (required)

### Options

- `--service-name`: Override service name (defaults to EntityContainer name)
- `--package-name`: NPM package name (defaults to @template/<service-name>-effect)
- `--force`: Overwrite existing files

## Generated Code

The generator produces:

- `Models.ts` - Schema classes for entities and complex types
- `QueryModels.ts` - Type-safe query paths for filtering and ordering
- `*Service.ts` - Effect-based service functions for each entity set
- `*ServicePromise.ts` - Promise-based service functions
- `index.ts` - Re-exports all generated code

## License

MIT

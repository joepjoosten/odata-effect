# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**odata-effect** is an Effect-based OData client library for SAP OData V2/V4 services. It's a monorepo with three packages:
- **@odata-effect/odata-effect** - Core Effect-based OData client
- **@odata-effect/odata-effect-promise** - Promise-based wrapper for non-Effect codebases
- **@odata-effect/odata-effect-generator** - Code generator for type-safe service clients from OData metadata

## Commands

```bash
# Install dependencies
pnpm install

# Type checking
pnpm check              # Type check root
pnpm check-recursive    # Type check all packages

# Build
pnpm build              # Full build (tsc + per-package builds)
pnpm codegen            # Run code generation across packages

# Lint
pnpm lint               # Check linting
pnpm lint-fix           # Auto-fix lint issues

# Test
pnpm test               # Run all tests with Vitest
pnpm coverage           # Generate test coverage
```

Run a single test file:
```bash
pnpm vitest run packages/odata-effect/test/ODataClientFn.test.ts
```

## Architecture

### Core Package (odata-effect)

The main client library uses Effect for error handling and dependency injection:

- **ODataClient.ts / ODataV4Client.ts** - V2/V4 types, config schemas, response wrappers
- **ODataClientFn.ts / ODataV4ClientFn.ts** - Tree-shakable operation functions (get, post, patch, del)
- **QueryBuilder.ts** - Type-safe query building ($filter, $select, $expand, $orderby)
- **Operations.ts** - Function imports and actions
- **Batch.ts** - Batch request support ($batch, changesets)
- **Errors.ts** - Error types (ODataError, SapError, ParseError, EntityNotFoundError)

Key design: Functions are exported both as namespace (`OData.get`) and individually for tree-shaking. All operations return `Effect<T, E, R>` with proper error typing.

### Promise Package (odata-effect-promise)

Wraps the Effect-based client for non-Effect codebases using `ManagedRuntime`. Provides `v2.ts` and `v4.ts` with Promise-returning functions that mirror the Effect API.

### Generator Package (odata-effect-generator)

Generates type-safe TypeScript clients from OData metadata XML:

1. **Parser** (`parser/`) - Parses EDMX metadata XML
2. **Digester** (`digester/`) - Transforms parsed XML to intermediate DataModel
3. **Generator** (`generator/`) - Generates TypeScript files:
   - Entity/ComplexType/EnumType schemas
   - Type-safe query functions
   - Package configuration (package.json, tsconfig.json)

## Key Patterns

### Effect Context

Configuration is injected via `ODataClientConfig` Context Tag:
```typescript
import { ODataClientConfig } from "@odata-effect/odata-effect"

const config = ODataClientConfig.of({ baseUrl: "..." })
pipe(operation, Effect.provide(config))
```

### Schema-First Design

All data structures use Effect Schema for runtime validation and type inference:
```typescript
const MyEntity = Schema.Struct({ id: Schema.String, name: Schema.String })
type MyEntity = Schema.Schema.Type<typeof MyEntity>
```

### Error Types

Custom `TaggedError` classes for different failure modes:
- `ODataError` - OData service errors with structured details
- `SapError` - SAP-specific error responses
- `ParseError` - Response parsing failures
- `EntityNotFoundError` - 404 responses

## Code Style

- **Formatting**: dprint with Effect plugin, 120 char lines, double quotes, no semicolons
- **Imports**: ESM with `.js` extensions, sorted imports
- **Types**: Strict TypeScript, no `any`, heavy use of generics
- **Exports**: Dual exports (namespace + individual) for tree-shaking

## Testing

Tests use Vitest with `@effect/vitest`. Mock the HttpClient layer for unit tests:
```typescript
import { HttpClient } from "@effect/platform"

const mockClient = Layer.succeed(HttpClient.HttpClient, mockHttpClient)
```

## Before Committing

**ALWAYS run these commands before creating a commit:**

```bash
pnpm codegen      # Regenerate index files and other generated code
pnpm lint-fix     # Fix linting issues
pnpm test         # Ensure all tests pass
```

This ensures generated files are up-to-date and code style is consistent. CI will fail if these are not run.

## Releasing

Uses Changesets for versioning and publishing:

```bash
# Create a changeset (run after making changes)
pnpm changeset

# Version packages (updates package.json, CHANGELOG, and lockfile)
pnpm changeset-version

# Build and publish to npm (usually done by CI)
pnpm changeset-publish
```

GitHub Actions automatically creates a "Version Packages" PR when changesets are merged to main. Merging that PR publishes to npm.
Write a changeset for any user-facing changes (new features, bug fixes, breaking changes) before merging to main.

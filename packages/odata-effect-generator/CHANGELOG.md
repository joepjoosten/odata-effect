# @odata-effect/odata-effect-generator

## 0.1.2

### Patch Changes

- [`c810201`](https://github.com/joepjoosten/odata-effect/commit/c810201ba565419cb48a152386cb378304a5f4cb) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix generated service imports to use subpath imports instead of main package exports. The generated code now correctly imports from `@odata-effect/odata-effect/ODataClient`, `@odata-effect/odata-effect/ODataV4Client`, `@odata-effect/odata-effect/OData`, `@odata-effect/odata-effect/ODataV4`, and `@odata-effect/odata-effect/Errors` for proper tree-shaking support.

  Also fixed CLI documentation to show correct usage: `odata-effect-gen generate <metadata-path> <output-dir>`

## 0.1.1

### Patch Changes

- [`e019e3e`](https://github.com/joepjoosten/odata-effect/commit/e019e3e488667b5e868c91b04cd25fc26187762d) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Fix bin path for CLI executable. The `odata-effect-gen` command was not working due to incorrect path in package.json.

## 0.1.0

### Minor Changes

- [`181dc6a`](https://github.com/joepjoosten/odata-effect/commit/181dc6af616ab274e8380dbbf10486eddb5eb3a9) Thanks [@joepjoosten](https://github.com/joepjoosten)! - Initial release of odata-effect packages, including core OData client, Promise-based wrapper, and code generator for type-safe service clients.

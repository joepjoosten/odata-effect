/**
 * CLI for OData Effect Generator.
 *
 * @since 1.0.0
 */
export * as Cli from "./Cli.js"

/**
 * CLI entry point for OData Effect Generator.
 *
 * @since 1.0.0
 */
export * as bin from "./bin.js"

/**
 * Digester for converting parsed EDMX into a DataModel.
 * Supports both OData V2 and V4.
 *
 * @since 1.0.0
 */
export * as Digester from "./digester/Digester.js"

/**
 * Type mapper for converting OData types to Effect Schema types and query paths.
 *
 * @since 1.0.0
 */
export * as TypeMapper from "./digester/TypeMapper.js"

/**
 * Main generator that orchestrates all code generation.
 *
 * @since 1.0.0
 */
export * as Generator from "./generator/Generator.js"

/**
 * Generator for index.ts - Public API exports.
 *
 * @since 1.0.0
 */
export * as IndexGenerator from "./generator/IndexGenerator.js"

/**
 * Generator for Models.ts - Effect Schema definitions.
 *
 * @since 1.0.0
 */
export * as ModelsGenerator from "./generator/ModelsGenerator.js"

/**
 * Naming utilities for code generation.
 *
 * @since 1.0.0
 */
export * as NamingHelper from "./generator/NamingHelper.js"

/**
 * Generator for type-safe, tree-shakable navigation path builders.
 *
 * Generates branded path types and navigation functions that can be composed
 * with pipe() for type-safe OData path construction.
 *
 * @example
 * ```typescript
 * import { pipe } from "effect"
 * import { People, byKey, trips, planItems, asFlight } from "./PathBuilders"
 *
 * const path = pipe(
 *   People,
 *   byKey("russellwhyte"),
 *   trips,
 *   byKey(0),
 *   planItems,
 *   asFlight
 * )
 * ```
 *
 * @since 1.0.0
 */
export * as NavigationGenerator from "./generator/NavigationGenerator.js"

/**
 * Generator for OData operations (FunctionImports, Functions, Actions).
 *
 * OData V2: FunctionImports
 * OData V4: Functions (GET, no side effects) and Actions (POST, with side effects)
 *
 * @since 1.0.0
 */
export * as OperationsGenerator from "./generator/OperationsGenerator.js"

/**
 * Generator for package configuration files.
 *
 * @since 1.0.0
 */
export * as PackageGenerator from "./generator/PackageGenerator.js"

/**
 * Generator for QueryModels.ts - Type-safe query paths.
 *
 * @since 1.0.0
 */
export * as QueryModelsGenerator from "./generator/QueryModelsGenerator.js"

/**
 * Generator for entity services using the crud factory.
 *
 * This module generates a single Services.ts file that creates CRUD services
 * for all entity sets using the crud factory from @odata-effect/odata-effect.
 *
 * @since 1.0.0
 */
export * as ServiceFnGenerator from "./generator/ServiceFnGenerator.js"

/**
 * Intermediate representation for OData metadata.
 * This is the central data model that digesters create and generators consume.
 *
 * @since 1.0.0
 */
export * as DataModel from "./model/DataModel.js"

/**
 * Configuration for code generation including name overrides.
 *
 * @since 1.0.0
 */
export * as GeneratorConfig from "./model/GeneratorConfig.js"

/**
 * Common EDMX schema interfaces for OData metadata parsing.
 * These interfaces represent the parsed XML structure from xml2js.
 *
 * @since 1.0.0
 */
export * as EdmxSchema from "./parser/EdmxSchema.js"

/**
 * Effect-wrapped XML parser for OData metadata.
 *
 * @since 1.0.0
 */
export * as XmlParser from "./parser/XmlParser.js"

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
import type { DataModel, EntityTypeModel } from "../model/DataModel.js"
import type { ODataVersion } from "../parser/EdmxSchema.js"
import { formatRelativeImport, getClassName, toCamelCase } from "./NamingHelper.js"

/**
 * Version-specific configuration.
 */
interface VersionConfig {
  readonly odataNamespace: string
  readonly clientModule: string
  readonly queryOptionsType: string
  readonly errorType: string
  readonly dependenciesType: string
}

const V2_CONFIG: VersionConfig = {
  odataNamespace: "OData",
  clientModule: "OData",
  queryOptionsType: "ODataQueryOptions",
  errorType: "ODataClientError",
  dependenciesType: "ODataClientDependencies"
}

const V4_CONFIG: VersionConfig = {
  odataNamespace: "ODataV4",
  clientModule: "ODataV4",
  queryOptionsType: "ODataV4QueryOptions",
  errorType: "ODataV4ClientError",
  dependenciesType: "ODataV4ClientDependencies"
}

const getVersionConfig = (version: ODataVersion): VersionConfig => version === "V4" ? V4_CONFIG : V2_CONFIG

/**
 * Get the path builders module name.
 */
export const getPathBuildersModuleName = (): string => "PathBuilders"

/**
 * Generated navigation file.
 *
 * @since 1.0.0
 * @category types
 */
export interface GeneratedNavigationFile {
  readonly fileName: string
  readonly content: string
}

/**
 * Result of navigation generation.
 *
 * @since 1.0.0
 * @category types
 */
export interface NavigationGenerationResult {
  readonly navigationFiles: ReadonlyArray<GeneratedNavigationFile>
}

/**
 * Track navigation property info for collision detection.
 */
interface NavPropertyInfo {
  readonly propertyName: string
  readonly odataName: string
  readonly sourceEntityName: string
  readonly targetEntityName: string
  readonly isCollection: boolean
}

/**
 * Collect all navigation properties across all entity types.
 */
const collectAllNavigationProperties = (dataModel: DataModel): ReadonlyArray<NavPropertyInfo> => {
  const navProps: Array<NavPropertyInfo> = []

  for (const entityType of dataModel.entityTypes.values()) {
    for (const navProp of entityType.navigationProperties) {
      const targetTypeName = getClassName(navProp.targetType)
      navProps.push({
        propertyName: navProp.name,
        odataName: navProp.odataName,
        sourceEntityName: entityType.name,
        targetEntityName: targetTypeName,
        isCollection: navProp.isCollection
      })
    }
  }

  return navProps
}

/**
 * Check if a navigation property name has collisions (same name, different source entities).
 */
const findCollisions = (navProps: ReadonlyArray<NavPropertyInfo>): Set<string> => {
  const collisions = new Set<string>()
  const seen = new Map<string, NavPropertyInfo>()

  for (const prop of navProps) {
    const existing = seen.get(prop.propertyName)
    if (existing) {
      // Collision if same name but different source entity
      if (existing.sourceEntityName !== prop.sourceEntityName) {
        collisions.add(prop.propertyName)
      }
    } else {
      seen.set(prop.propertyName, prop)
    }
  }

  return collisions
}

/**
 * Get the function name for a navigation property.
 */
const getNavFunctionName = (
  prop: NavPropertyInfo,
  hasCollision: boolean
): string => {
  if (hasCollision) {
    // Qualified name: personTrips, orderTrips
    return toCamelCase(`${prop.sourceEntityName}_${prop.propertyName}`)
  }
  return toCamelCase(prop.propertyName)
}

/**
 * Collect derived types for an entity type (for type casting).
 */
const getDerivedTypes = (
  baseTypeFqName: string,
  dataModel: DataModel
): ReadonlyArray<EntityTypeModel> => {
  const derived: Array<EntityTypeModel> = []

  for (const entityType of dataModel.entityTypes.values()) {
    if (entityType.baseType === baseTypeFqName) {
      derived.push(entityType)
      // Recursively get further derived types
      const furtherDerived = getDerivedTypes(entityType.fqName, dataModel)
      for (const d of furtherDerived) {
        derived.push(d)
      }
    }
  }

  return derived
}

/**
 * Options for navigation generation.
 *
 * @since 1.0.0
 * @category types
 */
export interface NavigationGeneratorOptions {
  /**
   * Add .js extensions to relative imports for ESM compatibility.
   */
  readonly esmExtensions: boolean
}

/**
 * Generate navigation builders.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateNavigations = (
  dataModel: DataModel,
  options: NavigationGeneratorOptions
): NavigationGenerationResult => {
  const { esmExtensions } = options
  const moduleName = getPathBuildersModuleName()
  const content = generatePathBuildersFile(dataModel, esmExtensions)

  return {
    navigationFiles: [{
      fileName: `${moduleName}.ts`,
      content
    }]
  }
}

/**
 * Generate the PathBuilders.ts file.
 */
const generatePathBuildersFile = (dataModel: DataModel, esmExtensions: boolean): string => {
  const lines: Array<string> = []
  const versionConfig = getVersionConfig(dataModel.version)

  // Collect all nav properties and find collisions
  const allNavProps = collectAllNavigationProperties(dataModel)
  const collisions = findCollisions(allNavProps)

  // Collect all entity type names that need to be referenced
  const referencedTypes = collectReferencedTypes(dataModel)

  // Header
  lines.push(`/**`)
  lines.push(` * Type-safe, tree-shakable path builders for OData navigation.`)
  lines.push(` * Generated by odata-effect-gen.`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * import { pipe } from "effect"`)
  lines.push(` * import { People, byKey, trips, planItems } from "./PathBuilders"`)
  lines.push(` *`)
  lines.push(` * const path = pipe(`)
  lines.push(` *   People,`)
  lines.push(` *   byKey("russellwhyte"),`)
  lines.push(` *   trips,`)
  lines.push(` *   byKey(0),`)
  lines.push(` *   planItems`)
  lines.push(` * )`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` */`)
  lines.push(``)

  // Imports
  lines.push(`import { ${versionConfig.odataNamespace} } from "@odata-effect/odata-effect"`)
  lines.push(`import { toPromise } from "@odata-effect/odata-effect-promise"`)
  lines.push(`import type { Effect, Schema } from "effect"`)
  lines.push(``)

  // Import model types with Model suffix to avoid collision with entity set names
  if (referencedTypes.size > 0) {
    lines.push(`import type {`)
    const typesList = Array.from(referencedTypes).sort()
    for (let i = 0; i < typesList.length; i++) {
      const isLast = i === typesList.length - 1
      lines.push(`  ${typesList[i]} as ${typesList[i]}Model${isLast ? "" : ","}`)
    }
    lines.push(`} from "${formatRelativeImport("Models", esmExtensions)}"`)
    lines.push(``)
  }

  // Path branded type
  lines.push(`// ============================================================================`)
  lines.push(`// Path Types`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Branded path type that tracks the entity type and whether it's a collection.`)
  lines.push(` * This enables type-safe navigation - you can only navigate to properties`)
  lines.push(` * that exist on the current entity type.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category types`)
  lines.push(` */`)
  lines.push(`export type Path<TEntity, IsCollection extends boolean = false> = string & {`)
  lines.push(`  readonly _entity: TEntity`)
  lines.push(`  readonly _collection: IsCollection`)
  lines.push(`}`)
  lines.push(``)

  // Entity set roots (PascalCase, types use Model suffix to avoid collision)
  lines.push(`// ============================================================================`)
  lines.push(`// Entity Set Roots`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  for (const entitySet of dataModel.entitySets.values()) {
    const entityType = dataModel.entityTypes.get(entitySet.entityTypeFqName)
    if (entityType) {
      lines.push(`/**`)
      lines.push(` * Root path for ${entitySet.name} entity set.`)
      lines.push(` *`)
      lines.push(` * @since 1.0.0`)
      lines.push(` * @category entity-sets`)
      lines.push(` */`)
      lines.push(
        `export const ${entitySet.name}: Path<${entityType.name}Model, true> = "${entitySet.name}" as Path<${entityType.name}Model, true>`
      )
      lines.push(``)
    }
  }

  // byKey function
  lines.push(`// ============================================================================`)
  lines.push(`// Key Access`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Navigate to a specific entity by key.`)
  lines.push(` * Works on any collection path.`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * pipe(People, byKey("russellwhyte"))  // Path<PersonModel, false>`)
  lines.push(` * pipe(Airports, byKey("KSFO"))        // Path<AirportModel, false>`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category navigation`)
  lines.push(` */`)
  lines.push(`export const byKey = <T>(key: string | number) =>`)
  lines.push(`  (base: Path<T, true>): Path<T, false> =>`)
  lines.push(`    \`\${base}(\${typeof key === "string" ? \`'\${key}'\` : key})\` as Path<T, false>`)
  lines.push(``)

  // Navigation property functions
  lines.push(`// ============================================================================`)
  lines.push(`// Navigation Properties`)
  lines.push(`// ============================================================================`)
  lines.push(``)

  // Group nav props by source entity for better organization
  const navPropsBySource = new Map<string, Array<NavPropertyInfo>>()
  for (const prop of allNavProps) {
    const existing = navPropsBySource.get(prop.sourceEntityName) || []
    existing.push(prop)
    navPropsBySource.set(prop.sourceEntityName, existing)
  }

  for (const [sourceEntity, props] of navPropsBySource) {
    lines.push(`// From ${sourceEntity}`)
    for (const prop of props) {
      const hasCollision = collisions.has(prop.propertyName)
      const fnName = getNavFunctionName(prop, hasCollision)
      const targetType = prop.targetEntityName

      lines.push(`/**`)
      lines.push(` * Navigate to ${prop.odataName}${prop.isCollection ? " collection" : ""}.`)
      lines.push(` *`)
      lines.push(` * @since 1.0.0`)
      lines.push(` * @category navigation`)
      lines.push(` */`)
      lines.push(
        `export const ${fnName} = (base: Path<${sourceEntity}Model, false>): Path<${targetType}Model, ${prop.isCollection}> =>`
      )
      lines.push(`  \`\${base}/${prop.odataName}\` as Path<${targetType}Model, ${prop.isCollection}>`)
      lines.push(``)
    }
  }

  // Type casting functions for derived types
  const castFunctions = generateTypeCastFunctions(dataModel)
  if (castFunctions.length > 0) {
    lines.push(`// ============================================================================`)
    lines.push(`// Type Casting (for entity inheritance)`)
    lines.push(`// ============================================================================`)
    lines.push(``)
    for (const castFunction of castFunctions) {
      lines.push(castFunction)
    }
  }

  // Terminal operations (Effect-based)
  lines.push(`// ============================================================================`)
  lines.push(`// Terminal Operations (Effect-based)`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Fetch a collection of entities at the given path (Effect-based).`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * const allPeople = yield* pipe(People, fetchCollection(Person))`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category operations`)
  lines.push(` */`)
  lines.push(`export const fetchCollection = <T, I>(schema: Schema.Schema<T, I>) =>`)
  lines.push(
    `  (path: Path<T, true>, options?: ${versionConfig.clientModule}.${versionConfig.queryOptionsType}): Effect.Effect<ReadonlyArray<T>, ${versionConfig.odataNamespace}.${versionConfig.errorType}, ${versionConfig.odataNamespace}.${versionConfig.dependenciesType}> =>`
  )
  lines.push(`    ${versionConfig.odataNamespace}.getCollection(path, schema, options)`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Fetch a single entity at the given path (Effect-based).`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * const person = yield* pipe(People, byKey("russell"), fetchOne(Person))`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category operations`)
  lines.push(` */`)
  lines.push(`export const fetchOne = <T, I>(schema: Schema.Schema<T, I>) =>`)
  lines.push(
    `  (path: Path<T, false>, options?: ${versionConfig.clientModule}.${versionConfig.queryOptionsType}): Effect.Effect<T, ${versionConfig.odataNamespace}.${versionConfig.errorType}, ${versionConfig.odataNamespace}.${versionConfig.dependenciesType}> =>`
  )
  lines.push(`    ${versionConfig.odataNamespace}.get(path, schema, options)`)
  lines.push(``)

  // Promise conversion (re-export from odata-effect-promise)
  lines.push(`// ============================================================================`)
  lines.push(`// Promise Conversion`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Convert an Effect to a Promise. Use at the end of a pipe chain.`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` * \`\`\`typescript`)
  lines.push(` * const myTrips = await pipe(`)
  lines.push(` *   People,`)
  lines.push(` *   byKey("russell"),`)
  lines.push(` *   trips,`)
  lines.push(` *   fetchCollection(Trip),`)
  lines.push(` *   toPromise(runtime)`)
  lines.push(` * )`)
  lines.push(` * \`\`\``)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category operations`)
  lines.push(` */`)
  lines.push(`export { toPromise }`)
  lines.push(``)

  return lines.join("\n")
}

/**
 * Generate type casting functions for derived types.
 */
const generateTypeCastFunctions = (dataModel: DataModel): Array<string> => {
  const lines: Array<string> = []
  const processed = new Set<string>()

  for (const entityType of dataModel.entityTypes.values()) {
    const derivedTypes = getDerivedTypes(entityType.fqName, dataModel)

    for (const derived of derivedTypes) {
      const fnName = `as${derived.name}`
      if (processed.has(fnName)) continue
      processed.add(fnName)

      const castPath = `${dataModel.namespace}.${derived.odataName}`

      lines.push(`/**`)
      lines.push(` * Cast collection to ${derived.name} (filters to derived type).`)
      lines.push(` *`)
      lines.push(` * @since 1.0.0`)
      lines.push(` * @category casting`)
      lines.push(` */`)
      lines.push(
        `export const ${fnName} = (base: Path<${entityType.name}Model, true>): Path<${derived.name}Model, true> =>`
      )
      lines.push(`  \`\${base}/${castPath}\` as Path<${derived.name}Model, true>`)
      lines.push(``)
    }
  }

  return lines
}

/**
 * Collect all entity type names referenced in paths.
 */
const collectReferencedTypes = (dataModel: DataModel): Set<string> => {
  const types = new Set<string>()

  // Entity set entity types
  for (const entitySet of dataModel.entitySets.values()) {
    const entityType = dataModel.entityTypes.get(entitySet.entityTypeFqName)
    if (entityType) {
      types.add(entityType.name)
    }
  }

  // Navigation target types
  for (const entityType of dataModel.entityTypes.values()) {
    for (const navProp of entityType.navigationProperties) {
      types.add(getClassName(navProp.targetType))
    }
  }

  // Derived types
  for (const entityType of dataModel.entityTypes.values()) {
    const derivedTypes = getDerivedTypes(entityType.fqName, dataModel)
    for (const derived of derivedTypes) {
      types.add(derived.name)
    }
  }

  return types
}

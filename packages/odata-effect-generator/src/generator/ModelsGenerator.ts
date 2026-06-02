/**
 * Generator for Models.ts - Effect Schema definitions.
 *
 * @since 1.0.0
 */
import type {
  ComplexTypeModel,
  DataModel,
  EntityTypeModel,
  EnumTypeModel,
  NavigationPropertyModel,
  PropertyModel
} from "../model/DataModel.js"
import { getClassName, getEditableTypeName, getIdTypeName, getPartialEditableTypeName } from "./NamingHelper.js"

interface EncodedKeyMapping {
  readonly odataName: string
  readonly name: string
}

/**
 * Get dependencies for a type (complex types it references via properties or baseType).
 */
const getTypeDependencies = (
  type: ComplexTypeModel | EntityTypeModel,
  allComplexTypes: Set<string>,
  allEntityTypes: Set<string>
): Set<string> => {
  const deps = new Set<string>()

  // Add base type dependency if it exists
  if (type.baseType) {
    const baseTypeName = getClassName(type.baseType.split(".").pop() ?? type.baseType)
    if (allComplexTypes.has(baseTypeName) || allEntityTypes.has(baseTypeName)) {
      deps.add(baseTypeName)
    }
  }

  // Add property type dependencies (for complex types referenced in properties)
  for (const prop of type.properties) {
    const propTypeName = prop.typeMapping.effectSchema
    if (allComplexTypes.has(propTypeName)) {
      deps.add(propTypeName)
    }
  }

  return deps
}

/**
 * Topologically sort types based on their dependencies.
 */
const sortTypesByDependency = <T extends ComplexTypeModel | EntityTypeModel>(
  types: Array<T>,
  allComplexTypes: Set<string>,
  allEntityTypes: Set<string>
): Array<T> => {
  const sorted: Array<T> = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const visit = (type: T) => {
    if (visited.has(type.name)) return
    if (visiting.has(type.name)) {
      // Circular dependency - just add it
      visited.add(type.name)
      sorted.push(type)
      return
    }

    visiting.add(type.name)

    const deps = getTypeDependencies(type, allComplexTypes, allEntityTypes)
    for (const depName of deps) {
      const depType = types.find((t) => t.name === depName)
      if (depType && !visited.has(depName)) {
        visit(depType)
      }
    }

    visiting.delete(type.name)
    visited.add(type.name)
    sorted.push(type)
  }

  for (const type of types) {
    visit(type)
  }

  return sorted
}

/**
 * Check if any property uses ODataSchema types.
 */
const needsODataSchemaImport = (dataModel: DataModel): boolean => {
  const checkProperties = (properties: ReadonlyArray<PropertyModel>): boolean =>
    properties.some((p) => p.typeMapping.effectSchema.startsWith("ODataSchema."))

  for (const type of dataModel.entityTypes.values()) {
    if (checkProperties(type.properties)) return true
  }
  for (const type of dataModel.complexTypes.values()) {
    if (checkProperties(type.properties)) return true
  }
  return false
}

/**
 * Check if generated schemas need OData V2 deferred navigation support.
 */
const needsODataDeferredImport = (dataModel: DataModel): boolean => {
  if (dataModel.version !== "V2") return false

  const hasNavigation = (type: ComplexTypeModel | EntityTypeModel): boolean => type.navigationProperties.length > 0

  for (const type of dataModel.entityTypes.values()) {
    if (hasNavigation(type)) return true
  }
  for (const type of dataModel.complexTypes.values()) {
    if (hasNavigation(type)) return true
  }
  return false
}

const needsV2NavigationCollectionHelper = (dataModel: DataModel): boolean => {
  if (dataModel.version !== "V2") return false

  const hasCollectionNavigation = (type: ComplexTypeModel | EntityTypeModel): boolean =>
    type.navigationProperties.some((navProp) => navProp.isCollection)

  for (const type of dataModel.entityTypes.values()) {
    if (hasCollectionNavigation(type)) return true
  }
  for (const type of dataModel.complexTypes.values()) {
    if (hasCollectionNavigation(type)) return true
  }
  return false
}

/**
 * Collect Effect namespaces used by generated TypeScript model interfaces.
 */
const collectTypeNamespaceImports = (dataModel: DataModel): Set<string> => {
  const namespaces = new Set<string>()

  const addPropertyTypes = (properties: ReadonlyArray<PropertyModel>) => {
    for (const prop of properties) {
      const tsType = prop.typeMapping.tsType
      if (tsType.startsWith("BigDecimal.")) namespaces.add("BigDecimal")
      if (tsType.startsWith("DateTime.")) namespaces.add("DateTime")
      if (tsType.startsWith("Duration.")) namespaces.add("Duration")
    }
  }

  for (const type of dataModel.entityTypes.values()) {
    addPropertyTypes(type.properties)
  }
  for (const type of dataModel.complexTypes.values()) {
    addPropertyTypes(type.properties)
  }

  return namespaces
}

/**
 * Generate the Models.ts file content.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateModels = (dataModel: DataModel): string => {
  const lines: Array<string> = []

  // Collect all type names for dependency resolution
  const allComplexTypes = new Set(Array.from(dataModel.complexTypes.values()).map((t) => t.name))
  const allEntityTypes = new Set(Array.from(dataModel.entityTypes.values()).map((t) => t.name))

  // Header
  lines.push(`/**`)
  lines.push(` * Effect Schema models for ${dataModel.serviceName} OData service.`)
  lines.push(` * Generated by odata-effect-gen.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` */`)
  lines.push(`import * as Schema from "effect/Schema"`)

  const includeV2NavigationCollectionHelper = needsV2NavigationCollectionHelper(dataModel)
  if (includeV2NavigationCollectionHelper) {
    lines.push(`import * as SchemaGetter from "effect/SchemaGetter"`)
  }

  const typeNamespaceImports = collectTypeNamespaceImports(dataModel)
  if (typeNamespaceImports.has("BigDecimal")) {
    lines.push(`import type * as BigDecimal from "effect/BigDecimal"`)
  }
  if (typeNamespaceImports.has("DateTime")) {
    lines.push(`import type * as DateTime from "effect/DateTime"`)
  }
  if (typeNamespaceImports.has("Duration")) {
    lines.push(`import type * as Duration from "effect/Duration"`)
  }

  const odataImports: Array<string> = []
  if (needsODataDeferredImport(dataModel)) odataImports.push("OData")
  if (needsODataSchemaImport(dataModel)) odataImports.push("ODataSchema")
  if (odataImports.length > 0) {
    lines.push(`import { ${odataImports.join(", ")} } from "@odata-effect/odata-effect"`)
  }

  lines.push(``)

  if (includeV2NavigationCollectionHelper) {
    for (const line of generateV2NavigationCollectionHelper()) lines.push(line)
    lines.push(``)
  }

  // Generate TypeScript model interfaces before schemas so recursive
  // navigation properties can use Schema.suspend with concrete types.
  for (const complexType of dataModel.complexTypes.values()) {
    for (const line of generateModelInterface(complexType, dataModel)) lines.push(line)
    lines.push(``)
  }
  for (const entityType of dataModel.entityTypes.values()) {
    for (const line of generateModelInterface(entityType, dataModel)) lines.push(line)
    lines.push(``)
  }

  // Generate enum types (no dependencies, always first)
  for (const enumType of dataModel.enumTypes.values()) {
    for (const line of generateEnumType(enumType)) lines.push(line)
    lines.push(``)
  }

  // Generate complex types in dependency order
  const sortedComplexTypes = sortTypesByDependency(
    Array.from(dataModel.complexTypes.values()),
    allComplexTypes,
    allEntityTypes
  )
  for (const complexType of sortedComplexTypes) {
    for (const line of generateComplexType(complexType, dataModel)) lines.push(line)
    lines.push(``)
  }

  // Generate entity types in dependency order
  const sortedEntityTypes = sortTypesByDependency(
    Array.from(dataModel.entityTypes.values()),
    allComplexTypes,
    allEntityTypes
  )
  for (const entityType of sortedEntityTypes) {
    for (const line of generateEntityType(entityType, dataModel)) lines.push(line)
    lines.push(``)
  }

  return lines.join("\n")
}

/**
 * Generate an enum type.
 */
const generateEnumType = (enumType: EnumTypeModel): Array<string> => {
  const lines: Array<string> = []
  const members = enumType.members.map((m) => `"${m.name}"`).join(", ")

  lines.push(`/**`)
  lines.push(` * ${enumType.odataName} enum type.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category enums`)
  lines.push(` */`)
  lines.push(`export const ${enumType.name} = Schema.Literal(${members})`)
  lines.push(`export type ${enumType.name} = typeof ${enumType.name}.Type`)

  return lines
}

const generateV2NavigationCollectionHelper = (): Array<string> => [
  `const v2NavigationCollection = <A>(`,
  `  schema: Schema.Codec<A, unknown, never, never>`,
  `) => {`,
  `  const collection = Schema.Array(schema)`,
  `  return Schema.Union([`,
  `    collection,`,
  `    Schema.Struct({`,
  `      results: collection`,
  `    }).pipe(`,
  `      Schema.decodeTo(collection, {`,
  `        decode: SchemaGetter.transform((wrapped) => wrapped.results),`,
  `        encode: SchemaGetter.transform((items) => ({ results: items as ReadonlyArray<A> }))`,
  `      })`,
  `    )`,
  `  ])`,
  `}`
]

/**
 * Generate a TypeScript interface for a model.
 */
const generateModelInterface = (
  type: ComplexTypeModel | EntityTypeModel,
  dataModel: DataModel
): Array<string> => {
  const lines: Array<string> = []
  const fields = [
    ...type.properties.map(generatePropertyTypeField),
    ...type.navigationProperties.map((navProp) => generateNavigationTypeField(navProp, dataModel))
  ]

  lines.push(`/**`)
  lines.push(` * ${type.odataName} decoded model.`)
  lines.push(` *`)
  lines.push(` * Navigation properties are optional because OData only includes them`)
  lines.push(` * when requested with $expand or returned as deferred V2 links.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)
  lines.push(`export interface ${type.name} {`)
  for (const field of fields) {
    lines.push(`  ${field}`)
  }
  lines.push(`}`)

  return lines
}

const generatePropertyTypeField = (prop: PropertyModel): string => {
  const optional = prop.isNullable && !prop.isKey
  const tsType = prop.isCollection ? `ReadonlyArray<${prop.typeMapping.tsType}>` : prop.typeMapping.tsType
  const fieldType = optional ? `${tsType} | null | undefined` : tsType
  return `readonly ${formatObjectKey(prop.name)}${optional ? "?" : ""}: ${fieldType}`
}

const generateNavigationTypeField = (
  navProp: NavigationPropertyModel,
  dataModel: DataModel
): string => {
  const targetType = getClassName(navProp.targetType)
  const expandedType = navProp.isCollection ? `ReadonlyArray<${targetType}>` : targetType
  const deferredType = dataModel.version === "V2" ? " | OData.DeferredContent" : ""
  const nullableType = navProp.isNullable ? " | null" : ""
  return `readonly ${formatObjectKey(navProp.name)}?: ${expandedType}${deferredType}${nullableType} | undefined`
}

/**
 * Generate a complex type.
 */
const generateComplexType = (
  complexType: ComplexTypeModel,
  dataModel: DataModel
): Array<string> => {
  const lines: Array<string> = []

  lines.push(`/**`)
  lines.push(` * ${complexType.odataName} complex type.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)

  const fields = generateSchemaFields(complexType.properties, complexType.navigationProperties, dataModel)
  const schemaKeys = getSchemaKeyMappings(complexType.properties, complexType.navigationProperties)

  lines.push(`export const ${complexType.name} = Schema.Struct({`)
  for (const f of fields) lines.push(`  ${f}`)
  lines.push(
    `})${generateEncodeKeysPipe(schemaKeys)} satisfies Schema.Codec<${complexType.name}, unknown, never, never>`
  )

  // Generate editable type
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Editable ${complexType.odataName} for creating/updating operations.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)

  const editableFields = generateEditableSchemaFields(complexType.properties)
  const editableName = getEditableTypeName(complexType.name)

  lines.push(`export const ${editableName} = Schema.Struct({`)
  for (const f of editableFields) lines.push(`  ${f}`)
  lines.push(`})${generateEncodeKeysPipe(complexType.properties)}`)
  lines.push(`export type ${editableName} = typeof ${editableName}.Type`)

  return lines
}

/**
 * Generate an entity type with ID and editable variants.
 */
const generateEntityType = (
  entityType: EntityTypeModel,
  dataModel: DataModel
): Array<string> => {
  const lines: Array<string> = []

  // Main entity schema
  lines.push(`/**`)
  lines.push(` * ${entityType.odataName} entity type.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)

  const fields = generateSchemaFields(entityType.properties, entityType.navigationProperties, dataModel)
  const schemaKeys = getSchemaKeyMappings(entityType.properties, entityType.navigationProperties)

  lines.push(`export const ${entityType.name} = Schema.Struct({`)
  for (const f of fields) lines.push(`  ${f}`)
  lines.push(
    `})${generateEncodeKeysPipe(schemaKeys)} satisfies Schema.Codec<${entityType.name}, unknown, never, never>`
  )

  // ID type
  if (entityType.keys.length > 0) {
    lines.push(``)
    lines.push(`/**`)
    lines.push(` * ${entityType.odataName} ID type.`)
    lines.push(` *`)
    lines.push(` * @since 1.0.0`)
    lines.push(` * @category models`)
    lines.push(` */`)

    const idTypeName = getIdTypeName(entityType.name)

    if (entityType.keys.length === 1) {
      const key = entityType.keys[0]
      const keySchema = getPropertySchemaType(key, false)
      lines.push(`export const ${idTypeName} = Schema.Union([`)
      lines.push(`  ${keySchema},`)
      lines.push(`  Schema.Struct({ ${key.name}: ${keySchema} })`)
      lines.push(`])`)
    } else {
      // Composite key - only struct form makes sense
      const keyFields = entityType.keys.map((k) => {
        const schema = getPropertySchemaType(k, false)
        return `${k.name}: ${schema}`
      })
      lines.push(`export const ${idTypeName} = Schema.Struct({ ${keyFields.join(", ")} })`)
    }
    lines.push(`export type ${idTypeName} = typeof ${idTypeName}.Type`)
  }

  // Editable type
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Editable ${entityType.odataName} for creating/updating operations.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)

  const editableFields = generateEditableSchemaFields(
    entityType.properties.filter((p) => !p.isKey)
  )
  const editableName = getEditableTypeName(entityType.name)

  lines.push(`export const ${editableName} = Schema.Struct({`)
  for (const f of editableFields) lines.push(`  ${f}`)
  lines.push(`})${generateEncodeKeysPipe(entityType.properties.filter((p) => !p.isKey))}`)
  lines.push(`export type ${editableName} = typeof ${editableName}.Type`)

  const partialEditableFields = generatePartialEditableSchemaFields(
    entityType.properties.filter((p) => !p.isKey)
  )
  const partialEditableName = getPartialEditableTypeName(entityType.name)

  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Partial editable ${entityType.odataName} for update operations.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category models`)
  lines.push(` */`)
  lines.push(`export const ${partialEditableName} = Schema.Struct({`)
  for (const f of partialEditableFields) lines.push(`  ${f}`)
  lines.push(`})${generateEncodeKeysPipe(entityType.properties.filter((p) => !p.isKey))}`)
  lines.push(`export type ${partialEditableName} = typeof ${partialEditableName}.Type`)

  return lines
}

/**
 * Generate schema field definitions for a model struct.
 * Navigation properties are optional and lazy to support expanded payloads
 * without forcing callers to expand every navigation property.
 */
const generateSchemaFields = (
  properties: ReadonlyArray<PropertyModel>,
  navigationProperties: ReadonlyArray<NavigationPropertyModel>,
  dataModel: DataModel
): Array<string> => {
  const fields: Array<string> = []
  const totalFields = properties.length + navigationProperties.length

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]
    const isOptional = prop.isNullable && !prop.isKey
    const schemaType = getPropertySchemaType(prop, isOptional)
    const isLast = i === totalFields - 1
    const fieldDef = getPropertyFieldDefinition(prop, schemaType, isOptional)
    fields.push(`${fieldDef}${isLast ? "" : ","}`)
  }

  for (let i = 0; i < navigationProperties.length; i++) {
    const navProp = navigationProperties[i]
    const schemaType = getNavigationSchemaType(navProp, dataModel)
    const isLast = properties.length + i === totalFields - 1
    fields.push(`${formatObjectKey(navProp.name)}: ${schemaType}${isLast ? "" : ","}`)
  }

  return fields
}

/**
 * Generate schema field definitions for an editable struct.
 */
const generateEditableSchemaFields = (
  properties: ReadonlyArray<PropertyModel>
): Array<string> => {
  const fields: Array<string> = []

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]
    const isOptional = prop.isNullable
    const schemaType = getPropertySchemaType(prop, isOptional)
    const isLast = i === properties.length - 1
    const fieldDef = getPropertyFieldDefinition(prop, schemaType, isOptional)
    fields.push(`${fieldDef}${isLast ? "" : ","}`)
  }

  return fields
}

/**
 * Generate schema field definitions for a partial editable struct.
 */
const generatePartialEditableSchemaFields = (
  properties: ReadonlyArray<PropertyModel>
): Array<string> => {
  const fields: Array<string> = []

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i]
    const schemaType = getPartialPropertySchemaType(prop)
    const isLast = i === properties.length - 1
    const fieldDef = getPropertyFieldDefinition(prop, schemaType, true)
    fields.push(`${fieldDef}${isLast ? "" : ","}`)
  }

  return fields
}

/**
 * Get a complete property field definition.
 *
 * When the OData property name differs from the TypeScript property name,
 * Field renaming is applied at the struct level with Schema.encodeKeys.
 *
 * @example
 * // When odataName == name:
 * name: Schema.String
 *
 * // When odataName ("Name") != name ("name") - optional field:
 * name: Schema.optional(Schema.NullOr(Schema.String))
 */
const getPropertyFieldDefinition = (
  prop: PropertyModel,
  schemaType: string,
  _isOptional: boolean
): string => {
  return `${formatObjectKey(prop.name)}: ${schemaType}`
}

/**
 * Get the Schema type for a property.
 */
const getPropertySchemaType = (
  prop: PropertyModel,
  makeOptional: boolean
): string => {
  const baseType = getPropertyBaseSchemaType(prop)

  // Handle nullable/optional
  if (makeOptional) {
    return `Schema.optional(Schema.NullOr(${baseType}))`
  }

  return baseType
}

const getPartialPropertySchemaType = (prop: PropertyModel): string => {
  const baseType = getPropertyBaseSchemaType(prop)
  return prop.isNullable ? `Schema.optional(Schema.NullOr(${baseType}))` : `Schema.optional(${baseType})`
}

const getPropertyBaseSchemaType = (prop: PropertyModel): string => {
  const baseType = prop.typeMapping.effectSchema
  return prop.isCollection ? `Schema.Array(${baseType})` : baseType
}

const getNavigationSchemaType = (
  navProp: NavigationPropertyModel,
  dataModel: DataModel
): string => {
  const targetType = getClassName(navProp.targetType)
  const targetSchema = `Schema.suspend((): Schema.Codec<${targetType}, unknown, never, never> => ${targetType})`
  const expandedSchema = dataModel.version === "V2" && navProp.isCollection
    ? `v2NavigationCollection(${targetSchema})`
    : navProp.isCollection
    ? `Schema.Array(${targetSchema})`
    : targetSchema
  const baseSchema = dataModel.version === "V2"
    ? `Schema.Union([${expandedSchema}, OData.DeferredContent])`
    : expandedSchema
  const nullableSchema = navProp.isNullable ? `Schema.NullOr(${baseSchema})` : baseSchema

  return `Schema.optional(${nullableSchema})`
}

const getSchemaKeyMappings = (
  properties: ReadonlyArray<PropertyModel>,
  navigationProperties: ReadonlyArray<NavigationPropertyModel>
): ReadonlyArray<EncodedKeyMapping> => [...properties, ...navigationProperties]

const generateEncodeKeysPipe = (properties: ReadonlyArray<EncodedKeyMapping>): string => {
  const mappings = properties.filter((prop) => prop.odataName !== prop.name)
  if (mappings.length === 0) return ""

  const entries = mappings.map((prop) => `${formatObjectKey(prop.name)}: ${JSON.stringify(prop.odataName)}`)
  return `.pipe(Schema.encodeKeys({ ${entries.join(", ")} }))`
}

const formatObjectKey = (key: string): string => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)

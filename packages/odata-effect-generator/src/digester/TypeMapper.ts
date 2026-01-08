/**
 * Type mapper for converting OData types to Effect Schema types and query paths.
 *
 * @since 1.0.0
 */
import type { TypeMapping } from "../model/DataModel.js"
import type { ODataVersion } from "../parser/EdmxSchema.js"

// ============================================================================
// Type Mappings
// ============================================================================

/**
 * Default type mapping for unknown types.
 */
const UNKNOWN_TYPE: TypeMapping = {
  effectSchema: "Schema.Unknown",
  queryPath: "StringPath",
  tsType: "unknown"
}

/**
 * OData V2 type mappings.
 */
const V2_TYPE_MAP: Record<string, TypeMapping> = {
  "Edm.String": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Boolean": { effectSchema: "Schema.Boolean", queryPath: "BooleanPath", tsType: "boolean" },
  "Edm.Byte": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.SByte": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int16": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int32": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int64": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Single": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Double": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Decimal": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Guid": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Time": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.DateTime": { effectSchema: "Schema.Date", queryPath: "DateTimePath", tsType: "Date" },
  "Edm.DateTimeOffset": { effectSchema: "Schema.Date", queryPath: "DateTimePath", tsType: "Date" },
  "Edm.Binary": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" }
}

/**
 * OData V4 type mappings (extends V2).
 */
const V4_TYPE_MAP: Record<string, TypeMapping> = {
  ...V2_TYPE_MAP,
  "Edm.Date": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.TimeOfDay": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Duration": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Stream": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.GeographyPoint": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" },
  "Edm.GeographyLineString": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" },
  "Edm.GeographyPolygon": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" },
  "Edm.GeometryPoint": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" },
  "Edm.GeometryLineString": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" },
  "Edm.GeometryPolygon": { effectSchema: "Schema.Unknown", queryPath: "StringPath", tsType: "unknown" }
}

// ============================================================================
// Type Mapper
// ============================================================================

/**
 * Parsed OData type information.
 */
export interface ParsedType {
  readonly baseType: string
  readonly isCollection: boolean
}

/**
 * Parse an OData type string to extract base type and collection info.
 *
 * @example
 * parseODataType("Edm.String") // { baseType: "Edm.String", isCollection: false }
 * parseODataType("Collection(Edm.String)") // { baseType: "Edm.String", isCollection: true }
 *
 * @since 1.0.0
 * @category parsing
 */
export const parseODataType = (typeString: string): ParsedType => {
  const collectionMatch = typeString.match(/^Collection\((.+)\)$/)
  if (collectionMatch) {
    return {
      baseType: collectionMatch[1],
      isCollection: true
    }
  }
  return {
    baseType: typeString,
    isCollection: false
  }
}

/**
 * Check if a type is a primitive EDM type.
 *
 * @since 1.0.0
 * @category type-checking
 */
export const isPrimitiveType = (type: string): boolean => {
  return type.startsWith("Edm.")
}

/**
 * Get the type mapping for a primitive OData type.
 *
 * @since 1.0.0
 * @category type-mapping
 */
export const getPrimitiveTypeMapping = (
  version: ODataVersion,
  type: string
): TypeMapping => {
  const typeMap = version === "V2" ? V2_TYPE_MAP : V4_TYPE_MAP
  return typeMap[type] ?? UNKNOWN_TYPE
}

/**
 * Create a type mapping for a complex type reference.
 *
 * @since 1.0.0
 * @category type-mapping
 */
export const getComplexTypeMapping = (typeName: string): TypeMapping => ({
  effectSchema: typeName,
  queryPath: `EntityPath<Q${typeName}>`,
  tsType: typeName
})

/**
 * Create a type mapping for an enum type reference.
 *
 * @since 1.0.0
 * @category type-mapping
 */
export const getEnumTypeMapping = (typeName: string): TypeMapping => ({
  effectSchema: typeName,
  queryPath: "StringPath",
  tsType: typeName
})

/**
 * Create a type mapping for a navigation property (single entity).
 *
 * @since 1.0.0
 * @category type-mapping
 */
export const getNavigationTypeMapping = (typeName: string): TypeMapping => ({
  effectSchema: `Schema.optional(${typeName})`,
  queryPath: `EntityPath<Q${typeName}>`,
  tsType: `${typeName} | undefined`
})

/**
 * Create a type mapping for a navigation property (collection).
 *
 * @since 1.0.0
 * @category type-mapping
 */
export const getCollectionNavigationTypeMapping = (typeName: string): TypeMapping => ({
  effectSchema: `Schema.optional(Schema.Array(${typeName}))`,
  queryPath: `CollectionPath<Q${typeName}>`,
  tsType: `ReadonlyArray<${typeName}> | undefined`
})

/**
 * Extract the simple type name from a fully qualified name.
 *
 * @example
 * getSimpleTypeName("ODataDemo.Product") // "Product"
 * getSimpleTypeName("Product") // "Product"
 *
 * @since 1.0.0
 * @category naming
 */
export const getSimpleTypeName = (fqName: string): string => {
  const parts = fqName.split(".")
  return parts[parts.length - 1]
}

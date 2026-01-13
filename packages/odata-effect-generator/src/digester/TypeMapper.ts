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
 *
 * Note: OData V2 sends certain types differently than V4:
 * - DateTime/DateTimeOffset: Uses /Date(millis)/ format → DateTime.Utc / DateTime.Zoned
 * - Time: Uses PT12H30M15S duration format → Duration.Duration
 * - Byte, SByte, Single, Double: Sent as strings in JSON
 * - Int64, Decimal: Sent as strings → BigDecimal.BigDecimal for precision
 */
const V2_TYPE_MAP: Record<string, TypeMapping> = {
  "Edm.String": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Boolean": { effectSchema: "Schema.Boolean", queryPath: "BooleanPath", tsType: "boolean" },
  "Edm.Byte": { effectSchema: "ODataSchema.ODataV2Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.SByte": { effectSchema: "ODataSchema.ODataV2Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int16": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int32": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int64": {
    effectSchema: "ODataSchema.ODataV2Int64",
    queryPath: "Int64Path",
    tsType: "ODataSchema.Int64"
  },
  "Edm.Single": { effectSchema: "ODataSchema.ODataV2Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Double": { effectSchema: "ODataSchema.ODataV2Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Decimal": {
    effectSchema: "ODataSchema.ODataV2Decimal",
    queryPath: "BigDecimalPath",
    tsType: "BigDecimal.BigDecimal"
  },
  "Edm.Guid": { effectSchema: "ODataSchema.ODataGuid", queryPath: "StringPath", tsType: "string" },
  "Edm.Time": {
    effectSchema: "ODataSchema.ODataV2Time",
    queryPath: "DurationPath",
    tsType: "Duration.Duration"
  },
  "Edm.DateTime": {
    effectSchema: "ODataSchema.ODataV2DateTime",
    queryPath: "DateTimePath",
    tsType: "DateTime.Utc"
  },
  "Edm.DateTimeOffset": {
    effectSchema: "ODataSchema.ODataV2DateTimeOffset",
    queryPath: "DateTimePath",
    tsType: "DateTime.Zoned"
  },
  "Edm.Binary": { effectSchema: "ODataSchema.ODataBinary", queryPath: "StringPath", tsType: "string" }
}

/**
 * OData V4 type mappings.
 *
 * Note: V4 uses different formats than V2:
 * - DateTimeOffset: Uses ISO 8601 format → DateTime.Zoned
 * - Date: Uses date-only format (2022-12-31) → DateTime.Utc
 * - Duration: Uses ISO 8601 duration format → Duration.Duration
 * - Numeric types: Sent as actual JSON numbers, not strings
 */
const V4_TYPE_MAP: Record<string, TypeMapping> = {
  "Edm.String": { effectSchema: "Schema.String", queryPath: "StringPath", tsType: "string" },
  "Edm.Boolean": { effectSchema: "Schema.Boolean", queryPath: "BooleanPath", tsType: "boolean" },
  "Edm.Byte": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.SByte": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int16": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int32": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Int64": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Single": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Double": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Decimal": { effectSchema: "Schema.Number", queryPath: "NumberPath", tsType: "number" },
  "Edm.Guid": { effectSchema: "ODataSchema.ODataGuid", queryPath: "StringPath", tsType: "string" },
  "Edm.Binary": { effectSchema: "ODataSchema.ODataBinary", queryPath: "StringPath", tsType: "string" },
  "Edm.DateTimeOffset": {
    effectSchema: "ODataSchema.ODataV4DateTimeOffset",
    queryPath: "DateTimePath",
    tsType: "DateTime.Zoned"
  },
  "Edm.Date": {
    effectSchema: "ODataSchema.ODataV4Date",
    queryPath: "DateTimePath",
    tsType: "DateTime.Utc"
  },
  "Edm.TimeOfDay": { effectSchema: "ODataSchema.ODataV4TimeOfDay", queryPath: "StringPath", tsType: "string" },
  "Edm.Duration": {
    effectSchema: "ODataSchema.ODataV4Duration",
    queryPath: "DurationPath",
    tsType: "Duration.Duration"
  },
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

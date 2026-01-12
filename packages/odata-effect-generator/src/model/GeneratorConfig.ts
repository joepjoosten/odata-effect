/**
 * Configuration for code generation including name overrides.
 *
 * @since 1.0.0
 */

/**
 * Override configuration for property names.
 * Maps OData property names to TypeScript property names.
 *
 * @example
 * ```ts
 * const overrides: PropertyOverrides = {
 *   "ID": "id",     // OData "ID" -> TypeScript "id" (instead of "iD")
 *   "SKU": "sku"    // OData "SKU" -> TypeScript "sku"
 * }
 * ```
 *
 * @since 1.0.0
 * @category config
 */
export type PropertyOverrides = Record<string, string>

/**
 * Override configuration for a single entity or complex type.
 *
 * @since 1.0.0
 * @category config
 */
export interface TypeOverrides {
  /**
   * Override the TypeScript class name for this type.
   * If not specified, uses the default camelCase conversion.
   */
  readonly name?: string

  /**
   * Override individual property names.
   * Maps OData property names to TypeScript property names.
   */
  readonly properties?: PropertyOverrides
}

/**
 * Override configuration for naming conversions.
 *
 * @since 1.0.0
 * @category config
 */
export interface NamingOverrides {
  /**
   * Override configurations for entity types.
   * Keys are OData entity type names.
   */
  readonly entities?: Record<string, TypeOverrides>

  /**
   * Override configurations for complex types.
   * Keys are OData complex type names.
   */
  readonly complexTypes?: Record<string, TypeOverrides>

  /**
   * Global property name overrides applied to all types.
   * Type-specific overrides take precedence over global overrides.
   */
  readonly properties?: PropertyOverrides
}

/**
 * Get the overridden property name or undefined if no override exists.
 *
 * @since 1.0.0
 * @category naming
 */
export const getPropertyOverride = (
  overrides: NamingOverrides | undefined,
  typeName: string,
  typeKind: "entity" | "complex",
  odataPropertyName: string
): string | undefined => {
  if (!overrides) return undefined

  // Check type-specific overrides first
  const typeOverrides = typeKind === "entity"
    ? overrides.entities?.[typeName]
    : overrides.complexTypes?.[typeName]

  if (typeOverrides?.properties?.[odataPropertyName]) {
    return typeOverrides.properties[odataPropertyName]
  }

  // Check global property overrides
  if (overrides.properties?.[odataPropertyName]) {
    return overrides.properties[odataPropertyName]
  }

  return undefined
}

/**
 * Get the overridden type name or undefined if no override exists.
 *
 * @since 1.0.0
 * @category naming
 */
export const getTypeOverride = (
  overrides: NamingOverrides | undefined,
  typeName: string,
  typeKind: "entity" | "complex"
): string | undefined => {
  if (!overrides) return undefined

  const typeOverrides = typeKind === "entity"
    ? overrides.entities?.[typeName]
    : overrides.complexTypes?.[typeName]

  return typeOverrides?.name
}

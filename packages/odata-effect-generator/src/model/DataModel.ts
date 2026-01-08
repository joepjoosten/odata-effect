/**
 * Intermediate representation for OData metadata.
 * This is the central data model that digesters create and generators consume.
 *
 * @since 1.0.0
 */
import type { ODataVersion } from "../parser/EdmxSchema.js"

// ============================================================================
// Data Model
// ============================================================================

/**
 * Central data model representing a parsed OData service.
 *
 * @since 1.0.0
 * @category model
 */
export interface DataModel {
  readonly version: ODataVersion
  readonly namespace: string
  readonly serviceName: string
  readonly entityTypes: Map<string, EntityTypeModel>
  readonly complexTypes: Map<string, ComplexTypeModel>
  readonly enumTypes: Map<string, EnumTypeModel>
  readonly entitySets: Map<string, EntitySetModel>
  readonly singletons: Map<string, SingletonModel>
  readonly operations: Map<string, OperationModel>
}

// ============================================================================
// Property Model
// ============================================================================

/**
 * Type mapping information for a property.
 *
 * @since 1.0.0
 * @category model
 */
export interface TypeMapping {
  readonly effectSchema: string
  readonly queryPath: string
  readonly tsType: string
}

/**
 * Represents a property of an entity or complex type.
 *
 * @since 1.0.0
 * @category model
 */
export interface PropertyModel {
  readonly odataName: string
  readonly name: string
  readonly odataType: string
  readonly typeMapping: TypeMapping
  readonly isCollection: boolean
  readonly isNullable: boolean
  readonly isKey: boolean
  readonly maxLength?: number
  readonly precision?: number
  readonly scale?: number
}

// ============================================================================
// Navigation Property Model
// ============================================================================

/**
 * Represents a navigation property.
 *
 * @since 1.0.0
 * @category model
 */
export interface NavigationPropertyModel {
  readonly odataName: string
  readonly name: string
  readonly targetType: string
  readonly isCollection: boolean
  readonly isNullable: boolean
  readonly partner?: string
}

// ============================================================================
// Entity Type Model
// ============================================================================

/**
 * Represents an entity type.
 *
 * @since 1.0.0
 * @category model
 */
export interface EntityTypeModel {
  readonly fqName: string
  readonly odataName: string
  readonly name: string
  readonly keys: ReadonlyArray<PropertyModel>
  readonly properties: ReadonlyArray<PropertyModel>
  readonly navigationProperties: ReadonlyArray<NavigationPropertyModel>
  readonly baseType?: string
  readonly isAbstract: boolean
  readonly isOpen: boolean
}

// ============================================================================
// Complex Type Model
// ============================================================================

/**
 * Represents a complex type.
 *
 * @since 1.0.0
 * @category model
 */
export interface ComplexTypeModel {
  readonly fqName: string
  readonly odataName: string
  readonly name: string
  readonly properties: ReadonlyArray<PropertyModel>
  readonly navigationProperties: ReadonlyArray<NavigationPropertyModel>
  readonly baseType?: string
  readonly isAbstract: boolean
  readonly isOpen: boolean
}

// ============================================================================
// Enum Type Model
// ============================================================================

/**
 * Represents an enum member.
 *
 * @since 1.0.0
 * @category model
 */
export interface EnumMemberModel {
  readonly name: string
  readonly value: number
}

/**
 * Represents an enum type.
 *
 * @since 1.0.0
 * @category model
 */
export interface EnumTypeModel {
  readonly fqName: string
  readonly odataName: string
  readonly name: string
  readonly members: ReadonlyArray<EnumMemberModel>
  readonly isFlags: boolean
}

// ============================================================================
// Entity Set Model
// ============================================================================

/**
 * Represents an entity set in the entity container.
 *
 * @since 1.0.0
 * @category model
 */
export interface EntitySetModel {
  readonly name: string
  readonly entityTypeFqName: string
  readonly entityTypeName: string
}

// ============================================================================
// Singleton Model
// ============================================================================

/**
 * Represents a singleton in the entity container.
 *
 * @since 1.0.0
 * @category model
 */
export interface SingletonModel {
  readonly name: string
  readonly typeFqName: string
  readonly typeName: string
}

// ============================================================================
// Operation Model
// ============================================================================

/**
 * Represents an operation parameter.
 *
 * @since 1.0.0
 * @category model
 */
export interface OperationParameterModel {
  readonly name: string
  readonly odataType: string
  readonly typeMapping: TypeMapping
  readonly isNullable: boolean
  readonly isCollection: boolean
}

/**
 * Represents a function or action.
 *
 * @since 1.0.0
 * @category model
 */
export interface OperationModel {
  readonly fqName: string
  readonly odataName: string
  readonly name: string
  readonly type: "Function" | "Action"
  readonly isBound: boolean
  readonly bindingParameter?: OperationParameterModel
  readonly parameters: ReadonlyArray<OperationParameterModel>
  readonly returnType?: {
    readonly odataType: string
    readonly typeMapping: TypeMapping
    readonly isCollection: boolean
    readonly isNullable: boolean
  }
  readonly entitySetPath?: string
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an empty data model.
 *
 * @since 1.0.0
 * @category constructors
 */
export const createDataModel = (
  version: ODataVersion,
  namespace: string,
  serviceName: string
): DataModel => ({
  version,
  namespace,
  serviceName,
  entityTypes: new Map(),
  complexTypes: new Map(),
  enumTypes: new Map(),
  entitySets: new Map(),
  singletons: new Map(),
  operations: new Map()
})

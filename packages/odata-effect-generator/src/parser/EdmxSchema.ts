/**
 * Common EDMX schema interfaces for OData metadata parsing.
 * These interfaces represent the parsed XML structure from xml2js.
 *
 * @since 1.0.0
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ODataEdmxModel {
  readonly "edmx:Edmx": {
    readonly $: { readonly Version: string }
    readonly "edmx:DataServices": ReadonlyArray<DataServices>
  }
}

export interface DataServices {
  readonly Schema: ReadonlyArray<Schema>
}

export interface Schema {
  readonly $: {
    readonly Namespace: string
    readonly Alias?: string
  }
  readonly EntityType?: ReadonlyArray<EntityType>
  readonly ComplexType?: ReadonlyArray<ComplexType>
  readonly EnumType?: ReadonlyArray<EnumType>
  readonly EntityContainer?: ReadonlyArray<EntityContainer>
  readonly TypeDefinition?: ReadonlyArray<TypeDefinition>
  readonly Association?: ReadonlyArray<Association>
  readonly Function?: ReadonlyArray<Operation>
  readonly Action?: ReadonlyArray<Operation>
}

// ============================================================================
// Entity Type
// ============================================================================

export interface EntityType {
  readonly $: {
    readonly Name: string
    readonly BaseType?: string
    readonly Abstract?: string
    readonly OpenType?: string
  }
  readonly Key?: ReadonlyArray<Key>
  readonly Property?: ReadonlyArray<Property>
  readonly NavigationProperty?: ReadonlyArray<NavigationProperty>
}

export interface Key {
  readonly PropertyRef: ReadonlyArray<PropertyRef>
}

export interface PropertyRef {
  readonly $: {
    readonly Name: string
  }
}

export interface Property {
  readonly $: {
    readonly Name: string
    readonly Type: string
    readonly Nullable?: string
    readonly MaxLength?: string
    readonly Precision?: string
    readonly Scale?: string
    readonly DefaultValue?: string
    readonly ConcurrencyMode?: string
    // SAP-specific attributes
    readonly "sap:label"?: string
    readonly "sap:creatable"?: string
    readonly "sap:updatable"?: string
    readonly "sap:filterable"?: string
    readonly "sap:sortable"?: string
  }
}

// ============================================================================
// Navigation Property
// ============================================================================

// V2 NavigationProperty (uses Relationship/FromRole/ToRole)
export interface NavigationPropertyV2 {
  readonly $: {
    readonly Name: string
    readonly Relationship: string
    readonly FromRole: string
    readonly ToRole: string
  }
}

// V4 NavigationProperty (uses Type directly)
export interface NavigationPropertyV4 {
  readonly $: {
    readonly Name: string
    readonly Type: string
    readonly Nullable?: string
    readonly Partner?: string
    readonly ContainsTarget?: string
  }
}

export type NavigationProperty = NavigationPropertyV2 | NavigationPropertyV4

// ============================================================================
// Complex Type
// ============================================================================

export interface ComplexType {
  readonly $: {
    readonly Name: string
    readonly BaseType?: string
    readonly Abstract?: string
    readonly OpenType?: string
  }
  readonly Property?: ReadonlyArray<Property>
  readonly NavigationProperty?: ReadonlyArray<NavigationProperty>
}

// ============================================================================
// Enum Type
// ============================================================================

export interface EnumType {
  readonly $: {
    readonly Name: string
    readonly UnderlyingType?: string
    readonly IsFlags?: string
  }
  readonly Member: ReadonlyArray<EnumMember>
}

export interface EnumMember {
  readonly $: {
    readonly Name: string
    readonly Value?: string
  }
}

// ============================================================================
// Type Definition
// ============================================================================

export interface TypeDefinition {
  readonly $: {
    readonly Name: string
    readonly UnderlyingType: string
  }
}

// ============================================================================
// Association (V2 only)
// ============================================================================

export interface Association {
  readonly $: {
    readonly Name: string
  }
  readonly End: ReadonlyArray<AssociationEnd>
  readonly ReferentialConstraint?: ReadonlyArray<ReferentialConstraint>
}

export interface AssociationEnd {
  readonly $: {
    readonly Role: string
    readonly Type: string
    readonly Multiplicity: string
  }
}

export interface ReferentialConstraint {
  readonly Principal: ReadonlyArray<ConstraintRole>
  readonly Dependent: ReadonlyArray<ConstraintRole>
}

export interface ConstraintRole {
  readonly $: {
    readonly Role: string
  }
  readonly PropertyRef: ReadonlyArray<PropertyRef>
}

// ============================================================================
// Entity Container
// ============================================================================

export interface EntityContainer {
  readonly $: {
    readonly Name: string
    readonly "m:IsDefaultEntityContainer"?: string
  }
  readonly EntitySet?: ReadonlyArray<EntitySet>
  readonly Singleton?: ReadonlyArray<Singleton>
  readonly AssociationSet?: ReadonlyArray<AssociationSet>
  readonly FunctionImport?: ReadonlyArray<FunctionImport>
  readonly ActionImport?: ReadonlyArray<ActionImport>
}

export interface EntitySet {
  readonly $: {
    readonly Name: string
    readonly EntityType: string
  }
  readonly NavigationPropertyBinding?: ReadonlyArray<NavigationPropertyBinding>
}

export interface Singleton {
  readonly $: {
    readonly Name: string
    readonly Type: string
  }
  readonly NavigationPropertyBinding?: ReadonlyArray<NavigationPropertyBinding>
}

export interface NavigationPropertyBinding {
  readonly $: {
    readonly Path: string
    readonly Target: string
  }
}

export interface AssociationSet {
  readonly $: {
    readonly Name: string
    readonly Association: string
  }
  readonly End: ReadonlyArray<AssociationSetEnd>
}

export interface AssociationSetEnd {
  readonly $: {
    readonly Role: string
    readonly EntitySet: string
  }
}

// ============================================================================
// Function / Action
// ============================================================================

export interface Operation {
  readonly $: {
    readonly Name: string
    readonly IsBound?: string
    readonly EntitySetPath?: string
  }
  readonly Parameter?: ReadonlyArray<OperationParameter>
  readonly ReturnType?: ReadonlyArray<OperationReturnType>
}

export interface OperationParameter {
  readonly $: {
    readonly Name: string
    readonly Type: string
    readonly Nullable?: string
    readonly Unicode?: string
    readonly Mode?: string
  }
}

export interface OperationReturnType {
  readonly $?: {
    readonly Type: string
    readonly Nullable?: string
  }
  readonly Type?: string
}

// ============================================================================
// Function Import / Action Import
// ============================================================================

export interface FunctionImport {
  readonly $: {
    readonly Name: string
    readonly Function?: string
    readonly EntitySet?: string
    readonly ReturnType?: string
    readonly "m:HttpMethod"?: string
  }
  readonly Parameter?: ReadonlyArray<OperationParameter>
}

export interface ActionImport {
  readonly $: {
    readonly Name: string
    readonly Action: string
    readonly EntitySet?: string
  }
}

// ============================================================================
// Version Detection
// ============================================================================

export type ODataVersion = "V2" | "V4"

export const detectODataVersion = (edmx: ODataEdmxModel): ODataVersion => {
  const version = edmx["edmx:Edmx"].$.Version
  if (version === "1.0") return "V2"
  if (version === "4.0") return "V4"
  throw new Error(`Unsupported EDMX version: ${version}`)
}

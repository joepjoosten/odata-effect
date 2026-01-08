/**
 * Digester for converting parsed EDMX into a DataModel.
 * Supports both OData V2 and V4.
 *
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import type {
  ODataEdmxModel,
  Schema as EdmxSchema,
  EntityType,
  ComplexType as EdmxComplexType,
  EnumType,
  Property,
  NavigationProperty,
  NavigationPropertyV2,
  NavigationPropertyV4,
  EntityContainer,
  Association,
  Operation
} from "../parser/EdmxSchema.js"
import { detectODataVersion, type ODataVersion } from "../parser/EdmxSchema.js"
import {
  type DataModel,
  type EntityTypeModel,
  type ComplexTypeModel,
  type EnumTypeModel,
  type PropertyModel,
  type NavigationPropertyModel,
  type EntitySetModel,
  type SingletonModel,
  type OperationModel,
  type OperationParameterModel,
  createDataModel
} from "../model/DataModel.js"
import {
  parseODataType,
  isPrimitiveType,
  getPrimitiveTypeMapping,
  getComplexTypeMapping,
  getEnumTypeMapping,
  getSimpleTypeName
} from "./TypeMapper.js"
import { getPropertyName, getClassName } from "../generator/NamingHelper.js"

/**
 * Error thrown during metadata digestion.
 *
 * @since 1.0.0
 * @category errors
 */
export class DigestError extends Schema.TaggedError<DigestError>()(
  "DigestError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown)
  }
) {}

/**
 * Context for digestion including type resolution.
 */
interface DigestContext {
  readonly version: ODataVersion
  readonly namespace: string
  readonly associations: Map<string, Association>
  readonly enumTypes: Set<string>
  readonly complexTypes: Set<string>
  readonly entityTypes: Set<string>
}

/**
 * Digest OData metadata into a DataModel.
 *
 * @since 1.0.0
 * @category digestion
 */
export const digestMetadata = (
  edmx: ODataEdmxModel
): Effect.Effect<DataModel, DigestError> =>
  Effect.try({
    try: () => {
      const version = detectODataVersion(edmx)
      const dataServices = edmx["edmx:Edmx"]["edmx:DataServices"][0]
      const schemas = dataServices.Schema

      if (!schemas || schemas.length === 0) {
        throw new Error("No schemas found in metadata")
      }

      // Use the first schema's namespace as the main namespace
      const mainSchema = schemas[0]
      const namespace = mainSchema.$.Namespace

      // Find entity container
      let entityContainer: EntityContainer | undefined
      for (const schema of schemas) {
        if (schema.EntityContainer && schema.EntityContainer.length > 0) {
          entityContainer = schema.EntityContainer[0]
          break
        }
      }

      const serviceName = entityContainer?.$.Name ?? "ODataService"
      const dataModel = createDataModel(version, namespace, serviceName)

      // Build context for type resolution
      const context = buildContext(version, namespace, schemas)

      // First pass: collect all type names
      for (const schema of schemas) {
        collectTypeNames(schema, context)
      }

      // Second pass: digest all types
      for (const schema of schemas) {
        digestSchema(schema, dataModel, context)
      }

      // Digest entity container
      if (entityContainer) {
        digestEntityContainer(entityContainer, dataModel, context)
      }

      return dataModel
    },
    catch: (error) =>
      new DigestError({
        message: error instanceof Error ? error.message : "Failed to digest metadata",
        cause: error
      })
  })

/**
 * Build digestion context from schemas.
 */
const buildContext = (
  version: ODataVersion,
  namespace: string,
  schemas: ReadonlyArray<EdmxSchema>
): DigestContext => {
  const associations = new Map<string, Association>()

  // Collect V2 associations
  for (const schema of schemas) {
    if (schema.Association) {
      for (const assoc of schema.Association) {
        const fqName = `${schema.$.Namespace}.${assoc.$.Name}`
        associations.set(fqName, assoc)
      }
    }
  }

  return {
    version,
    namespace,
    associations,
    enumTypes: new Set(),
    complexTypes: new Set(),
    entityTypes: new Set()
  }
}

/**
 * First pass: collect all type names for resolution.
 */
const collectTypeNames = (schema: EdmxSchema, context: DigestContext): void => {
  const ns = schema.$.Namespace

  if (schema.EnumType) {
    for (const enumType of schema.EnumType) {
      context.enumTypes.add(`${ns}.${enumType.$.Name}`)
    }
  }

  if (schema.ComplexType) {
    for (const complexType of schema.ComplexType) {
      context.complexTypes.add(`${ns}.${complexType.$.Name}`)
    }
  }

  if (schema.EntityType) {
    for (const entityType of schema.EntityType) {
      context.entityTypes.add(`${ns}.${entityType.$.Name}`)
    }
  }
}

/**
 * Digest a single schema.
 */
const digestSchema = (
  schema: EdmxSchema,
  dataModel: DataModel,
  context: DigestContext
): void => {
  const ns = schema.$.Namespace

  // Digest enum types
  if (schema.EnumType) {
    for (const enumType of schema.EnumType) {
      const model = digestEnumType(enumType, ns)
      dataModel.enumTypes.set(model.fqName, model)
    }
  }

  // Digest complex types
  if (schema.ComplexType) {
    for (const complexType of schema.ComplexType) {
      const model = digestComplexType(complexType, ns, context)
      dataModel.complexTypes.set(model.fqName, model)
    }
  }

  // Digest entity types
  if (schema.EntityType) {
    for (const entityType of schema.EntityType) {
      const model = digestEntityType(entityType, ns, context)
      dataModel.entityTypes.set(model.fqName, model)
    }
  }

  // Digest operations (V4 functions and actions)
  if (schema.Function) {
    for (const func of schema.Function) {
      const model = digestOperation(func, ns, "Function", context)
      dataModel.operations.set(model.fqName, model)
    }
  }

  if (schema.Action) {
    for (const action of schema.Action) {
      const model = digestOperation(action, ns, "Action", context)
      dataModel.operations.set(model.fqName, model)
    }
  }
}

/**
 * Digest an enum type.
 */
const digestEnumType = (enumType: EnumType, namespace: string): EnumTypeModel => {
  const name = enumType.$.Name
  const members = enumType.Member.map((member, index) => ({
    name: member.$.Name,
    value: member.$.Value !== undefined ? parseInt(member.$.Value, 10) : index
  }))

  return {
    fqName: `${namespace}.${name}`,
    odataName: name,
    name: getClassName(name),
    members,
    isFlags: enumType.$.IsFlags === "true"
  }
}

/**
 * Digest a complex type.
 */
const digestComplexType = (
  complexType: EdmxComplexType,
  namespace: string,
  context: DigestContext
): ComplexTypeModel => {
  const name = complexType.$.Name
  const properties = (complexType.Property ?? []).map((p) =>
    digestProperty(p, [], context)
  )
  const navigationProperties = (complexType.NavigationProperty ?? []).map((np) =>
    digestNavigationProperty(np, context)
  )

  const result: ComplexTypeModel = {
    fqName: `${namespace}.${name}`,
    odataName: name,
    name: getClassName(name),
    properties,
    navigationProperties,
    isAbstract: complexType.$.Abstract === "true",
    isOpen: complexType.$.OpenType === "true"
  }

  if (complexType.$.BaseType) {
    return { ...result, baseType: complexType.$.BaseType }
  }

  return result
}

/**
 * Digest an entity type.
 */
const digestEntityType = (
  entityType: EntityType,
  namespace: string,
  context: DigestContext
): EntityTypeModel => {
  const name = entityType.$.Name
  const keyNames = new Set<string>()

  // Collect key property names
  if (entityType.Key && entityType.Key[0]?.PropertyRef) {
    for (const keyRef of entityType.Key[0].PropertyRef) {
      keyNames.add(keyRef.$.Name)
    }
  }

  const properties = (entityType.Property ?? []).map((p) =>
    digestProperty(p, Array.from(keyNames), context)
  )

  const keys = properties.filter((p) => p.isKey)
  const navigationProperties = (entityType.NavigationProperty ?? []).map((np) =>
    digestNavigationProperty(np, context)
  )

  const result: EntityTypeModel = {
    fqName: `${namespace}.${name}`,
    odataName: name,
    name: getClassName(name),
    keys,
    properties,
    navigationProperties,
    isAbstract: entityType.$.Abstract === "true",
    isOpen: entityType.$.OpenType === "true"
  }

  if (entityType.$.BaseType) {
    return { ...result, baseType: entityType.$.BaseType }
  }

  return result
}

/**
 * Digest a property.
 */
const digestProperty = (
  property: Property,
  keyNames: ReadonlyArray<string>,
  context: DigestContext
): PropertyModel => {
  const odataName = property.$.Name
  const odataType = property.$.Type
  const { baseType, isCollection } = parseODataType(odataType)
  const isKey = keyNames.includes(odataName)
  const isNullable = property.$.Nullable !== "false" && !isKey

  const typeMapping = resolveTypeMapping(baseType, context)

  const result: PropertyModel = {
    odataName,
    name: getPropertyName(odataName),
    odataType,
    typeMapping,
    isCollection,
    isNullable,
    isKey
  }

  const withMaxLength = property.$.MaxLength
    ? { ...result, maxLength: parseInt(property.$.MaxLength, 10) }
    : result
  const withPrecision = property.$.Precision
    ? { ...withMaxLength, precision: parseInt(property.$.Precision, 10) }
    : withMaxLength
  const withScale = property.$.Scale
    ? { ...withPrecision, scale: parseInt(property.$.Scale, 10) }
    : withPrecision

  return withScale
}

/**
 * Check if a navigation property is V4 style (has Type attribute).
 */
const isV4NavigationProperty = (
  navProp: NavigationProperty
): navProp is NavigationPropertyV4 => {
  return "Type" in navProp.$
}

/**
 * Digest a navigation property.
 */
const digestNavigationProperty = (
  navProp: NavigationProperty,
  context: DigestContext
): NavigationPropertyModel => {
  const odataName = navProp.$.Name

  // V4 style navigation property (has Type attribute)
  if (isV4NavigationProperty(navProp)) {
    const { baseType, isCollection } = parseODataType(navProp.$.Type)
    const targetTypeName = getSimpleTypeName(baseType)

    const result: NavigationPropertyModel = {
      odataName,
      name: getPropertyName(odataName),
      targetType: targetTypeName,
      isCollection,
      isNullable: navProp.$.Nullable !== "false"
    }

    if (navProp.$.Partner) {
      return { ...result, partner: navProp.$.Partner }
    }

    return result
  }

  // V2 style navigation property (uses Relationship)
  const v2NavProp = navProp as NavigationPropertyV2
  const relationship = v2NavProp.$.Relationship
  const toRole = v2NavProp.$.ToRole
  const association = context.associations.get(relationship)

  let targetType = "unknown"
  let isCollection = false

  if (association) {
    const targetEnd = association.End.find((end) => end.$.Role === toRole)
    if (targetEnd) {
      targetType = getSimpleTypeName(targetEnd.$.Type)
      isCollection = targetEnd.$.Multiplicity === "*"
    }
  }

  return {
    odataName,
    name: getPropertyName(odataName),
    targetType,
    isCollection,
    isNullable: true
  }
}

/**
 * Digest entity container.
 */
const digestEntityContainer = (
  container: EntityContainer,
  dataModel: DataModel,
  context: DigestContext
): void => {
  // Digest entity sets
  if (container.EntitySet) {
    for (const entitySet of container.EntitySet) {
      const model: EntitySetModel = {
        name: entitySet.$.Name,
        entityTypeFqName: entitySet.$.EntityType,
        entityTypeName: getSimpleTypeName(entitySet.$.EntityType)
      }
      dataModel.entitySets.set(model.name, model)
    }
  }

  // Digest singletons (V4)
  if (container.Singleton) {
    for (const singleton of container.Singleton) {
      const model: SingletonModel = {
        name: singleton.$.Name,
        typeFqName: singleton.$.Type,
        typeName: getSimpleTypeName(singleton.$.Type)
      }
      dataModel.singletons.set(model.name, model)
    }
  }

  // Digest V2 function imports
  if (container.FunctionImport) {
    for (const funcImport of container.FunctionImport) {
      // Only process V2 function imports (no Function reference)
      if (!funcImport.$.Function) {
        const params: OperationParameterModel[] = (funcImport.Parameter ?? []).map((p) => {
          const { baseType, isCollection } = parseODataType(p.$.Type)
          return {
            name: getPropertyName(p.$.Name),
            odataType: p.$.Type,
            typeMapping: resolveTypeMapping(baseType, context),
            isNullable: p.$.Nullable !== "false",
            isCollection
          }
        })

        let model: OperationModel = {
          fqName: `${context.namespace}.${funcImport.$.Name}`,
          odataName: funcImport.$.Name,
          name: getPropertyName(funcImport.$.Name),
          type: "Function",
          isBound: false,
          parameters: params
        }

        if (funcImport.$.ReturnType) {
          const { baseType, isCollection } = parseODataType(funcImport.$.ReturnType)
          model = {
            ...model,
            returnType: {
              odataType: funcImport.$.ReturnType,
              typeMapping: resolveTypeMapping(baseType, context),
              isCollection,
              isNullable: false
            }
          }
        }

        if (funcImport.$.EntitySet) {
          model = { ...model, entitySetPath: funcImport.$.EntitySet }
        }

        dataModel.operations.set(model.fqName, model)
      }
    }
  }
}

/**
 * Digest an operation (Function or Action).
 */
const digestOperation = (
  operation: Operation,
  namespace: string,
  type: "Function" | "Action",
  context: DigestContext
): OperationModel => {
  const name = operation.$.Name
  const isBound = operation.$.IsBound === "true"

  const allParams = (operation.Parameter ?? []).map((p) => {
    const { baseType, isCollection } = parseODataType(p.$.Type)
    return {
      name: getPropertyName(p.$.Name),
      odataType: p.$.Type,
      typeMapping: resolveTypeMapping(baseType, context),
      isNullable: p.$.Nullable !== "false",
      isCollection
    }
  })

  // First parameter is binding parameter if bound
  const bindingParameter = isBound && allParams.length > 0 ? allParams[0] : undefined
  const parameters = isBound ? allParams.slice(1) : allParams

  let model: OperationModel = {
    fqName: `${namespace}.${name}`,
    odataName: name,
    name: getPropertyName(name),
    type,
    isBound,
    parameters
  }

  if (bindingParameter) {
    model = { ...model, bindingParameter }
  }

  if (operation.ReturnType && operation.ReturnType.length > 0) {
    const rt = operation.ReturnType[0]
    const typeStr = rt.$?.Type ?? rt.Type ?? ""
    if (typeStr) {
      const { baseType, isCollection } = parseODataType(typeStr)
      model = {
        ...model,
        returnType: {
          odataType: typeStr,
          typeMapping: resolveTypeMapping(baseType, context),
          isCollection,
          isNullable: rt.$?.Nullable !== "false"
        }
      }
    }
  }

  if (operation.$.EntitySetPath) {
    model = { ...model, entitySetPath: operation.$.EntitySetPath }
  }

  return model
}

/**
 * Resolve type mapping based on context.
 */
const resolveTypeMapping = (
  type: string,
  context: DigestContext
) => {
  if (isPrimitiveType(type)) {
    return getPrimitiveTypeMapping(context.version, type)
  }

  const simpleTypeName = getSimpleTypeName(type)

  if (context.enumTypes.has(type)) {
    return getEnumTypeMapping(getClassName(simpleTypeName))
  }

  if (context.complexTypes.has(type) || context.entityTypes.has(type)) {
    return getComplexTypeMapping(getClassName(simpleTypeName))
  }

  // Default to complex type mapping for unknown types
  return getComplexTypeMapping(getClassName(simpleTypeName))
}

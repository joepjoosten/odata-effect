/**
 * Generator for OData operations (FunctionImports, Functions, Actions).
 *
 * OData V2: FunctionImports
 * OData V4: Functions (GET, no side effects) and Actions (POST, with side effects)
 *
 * @since 1.0.0
 */
import type { DataModel, OperationModel, OperationParameterModel } from "../model/DataModel.js"
import type { ODataVersion } from "../parser/EdmxSchema.js"
import { formatRelativeImport, toPascalCase } from "./NamingHelper.js"

/**
 * Version-specific imports and identifiers.
 */
interface VersionConfig {
  readonly clientConfigTag: string
  readonly clientConfigImport: string
  readonly clientModule: string
}

const V2_CONFIG: VersionConfig = {
  clientConfigTag: "ODataClientConfig",
  clientConfigImport: "ODataClientConfig",
  clientModule: "OData"
}

const V4_CONFIG: VersionConfig = {
  clientConfigTag: "ODataV4ClientConfig",
  clientConfigImport: "ODataV4ClientConfig",
  clientModule: "ODataV4"
}

const getVersionConfig = (version: ODataVersion): VersionConfig => version === "V4" ? V4_CONFIG : V2_CONFIG

/**
 * Get the function name for an operation.
 * Note: operation.name is already properly cased by the Digester.
 *
 * @since 1.0.0
 * @category naming
 */
export const getOperationFunctionName = (operation: OperationModel): string => {
  return operation.name
}

/**
 * Get the operations module name.
 *
 * @since 1.0.0
 * @category naming
 */
export const getOperationsModuleName = (): string => "Operations"

/**
 * Generated operations file.
 *
 * @since 1.0.0
 * @category types
 */
export interface GeneratedOperationsFile {
  readonly fileName: string
  readonly content: string
}

/**
 * Result of operations generation.
 *
 * @since 1.0.0
 * @category types
 */
export interface OperationsGenerationResult {
  readonly operationsFile: GeneratedOperationsFile | null
}

/**
 * Options for operations generation.
 *
 * @since 1.0.0
 * @category types
 */
export interface OperationsGeneratorOptions {
  /**
   * Add .js extensions to relative imports for ESM compatibility.
   */
  readonly esmExtensions: boolean
}

/**
 * Generate the operations file.
 *
 * @since 1.0.0
 * @category generation
 */
export const generateOperations = (
  dataModel: DataModel,
  options: OperationsGeneratorOptions
): OperationsGenerationResult => {
  const { esmExtensions } = options

  // Get unbound operations only (bound operations are attached to entity services)
  const unboundOperations = Array.from(dataModel.operations.values()).filter((op) => !op.isBound)

  if (unboundOperations.length === 0) {
    return { operationsFile: null }
  }

  const content = generateOperationsFile(unboundOperations, dataModel, esmExtensions)

  return {
    operationsFile: {
      fileName: `${getOperationsModuleName()}.ts`,
      content
    }
  }
}

/**
 * Determine if an operation returns an entity or complex type that needs a schema.
 */
const returnsModelType = (operation: OperationModel, dataModel: DataModel): boolean => {
  if (!operation.returnType) return false

  const { odataType } = operation.returnType
  // Remove Collection() wrapper if present
  const baseType = odataType.replace(/^Collection\(|\)$/g, "")
  // Get the type name (may be fully qualified)
  const typeName = baseType.includes(".") ? baseType.split(".").pop() ?? baseType : baseType

  // Check if it's an entity or complex type
  for (const [fqName] of dataModel.entityTypes) {
    if (fqName.endsWith(`.${typeName}`) || fqName === typeName) return true
  }
  for (const [fqName] of dataModel.complexTypes) {
    if (fqName.endsWith(`.${typeName}`) || fqName === typeName) return true
  }

  return false
}

/**
 * Get the return type's TypeScript type name.
 */
const getReturnTypeName = (operation: OperationModel): string => {
  if (!operation.returnType) return "void"

  const { isCollection, typeMapping } = operation.returnType
  const baseType = typeMapping.tsType

  return isCollection ? `ReadonlyArray<${baseType}>` : baseType
}

/**
 * Check if any operation uses Schema.* types for primitives.
 */
const needsSchemaImport = (operations: ReadonlyArray<OperationModel>, dataModel: DataModel): boolean => {
  for (const operation of operations) {
    // Check return type - only if it's not a model type
    if (operation.returnType && !returnsModelType(operation, dataModel)) {
      if (operation.returnType.typeMapping.effectSchema.startsWith("Schema.")) {
        return true
      }
    }
    // Check parameters - only if they're not model types
    for (const param of operation.parameters) {
      if (param.typeMapping.effectSchema.startsWith("Schema.")) {
        // Check if it's not a model type
        const typeName = param.typeMapping.tsType
        let isModel = false
        for (const [fqName] of dataModel.entityTypes) {
          if (fqName.endsWith(`.${typeName}`) || fqName === typeName) {
            isModel = true
            break
          }
        }
        if (!isModel) {
          for (const [fqName] of dataModel.complexTypes) {
            if (fqName.endsWith(`.${typeName}`) || fqName === typeName) {
              isModel = true
              break
            }
          }
        }
        if (!isModel) return true
      }
    }
  }
  return false
}

/**
 * Check if any operation uses ODataSchema.* types.
 */
const needsODataSchemaImport = (operations: ReadonlyArray<OperationModel>, dataModel: DataModel): boolean => {
  for (const operation of operations) {
    // Check return type - only if it's not a model type
    if (operation.returnType && !returnsModelType(operation, dataModel)) {
      if (operation.returnType.typeMapping.effectSchema.startsWith("ODataSchema.")) {
        return true
      }
    }
    // Check parameters
    for (const param of operation.parameters) {
      if (param.typeMapping.effectSchema.startsWith("ODataSchema.")) {
        return true
      }
    }
  }
  return false
}

/**
 * Collect all model types that need to be imported.
 */
const collectModelImports = (operations: ReadonlyArray<OperationModel>, dataModel: DataModel): Set<string> => {
  const imports = new Set<string>()

  const isModelType = (typeName: string): boolean => {
    for (const [fqName] of dataModel.entityTypes) {
      if (fqName.endsWith(`.${typeName}`) || fqName === typeName) return true
    }
    for (const [fqName] of dataModel.complexTypes) {
      if (fqName.endsWith(`.${typeName}`) || fqName === typeName) return true
    }
    return false
  }

  for (const operation of operations) {
    // Check return type
    if (operation.returnType) {
      const typeName = operation.returnType.typeMapping.tsType
      if (isModelType(typeName)) {
        imports.add(typeName)
      }
    }

    // Check parameter types
    for (const param of operation.parameters) {
      const typeName = param.typeMapping.tsType
      if (isModelType(typeName)) {
        imports.add(typeName)
      }
    }
  }

  return imports
}

/**
 * Generate the operations file content.
 */
const generateOperationsFile = (
  operations: ReadonlyArray<OperationModel>,
  dataModel: DataModel,
  esmExtensions: boolean
): string => {
  const lines: Array<string> = []
  const versionConfig = getVersionConfig(dataModel.version)
  const isV4 = dataModel.version === "V4"

  // Determine which imports are needed
  const needsSchema = needsSchemaImport(operations, dataModel)
  const needsODataSchema = needsODataSchemaImport(operations, dataModel)

  // Header and imports
  lines.push(`/**`)
  lines.push(` * OData operations for ${dataModel.serviceName} OData ${dataModel.version}.`)
  lines.push(` * Generated by odata-effect-gen.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` */`)
  lines.push(`import * as Effect from "effect/Effect"`)
  if (needsSchema) {
    lines.push(`import * as Schema from "effect/Schema"`)
  }
  lines.push(`import { HttpClient } from "@effect/platform"`)
  lines.push(`import type * as HttpClientError from "@effect/platform/HttpClientError"`)
  lines.push(``)

  // Import Operations module
  lines.push(`import * as ODataOps from "@odata-effect/odata-effect/Operations"`)
  lines.push(`import {`)
  lines.push(`  ${versionConfig.clientConfigImport}`)
  lines.push(`} from "@odata-effect/odata-effect/${versionConfig.clientModule}"`)
  lines.push(`import {`)
  if (!isV4) {
    lines.push(`  type SapError,`)
  }
  lines.push(`  type ODataError,`)
  lines.push(`  type ParseError`)
  lines.push(`} from "@odata-effect/odata-effect/Errors"`)
  if (needsODataSchema) {
    lines.push(`import { ODataSchema } from "@odata-effect/odata-effect"`)
  }
  lines.push(``)

  // Import model types if needed
  const modelImports = collectModelImports(operations, dataModel)
  if (modelImports.size > 0) {
    lines.push(`import {`)
    const importsList = Array.from(modelImports)
    for (let i = 0; i < importsList.length; i++) {
      const isLast = i === importsList.length - 1
      lines.push(`  ${importsList[i]}${isLast ? "" : ","}`)
    }
    lines.push(`} from "${formatRelativeImport("Models", esmExtensions)}"`)
    lines.push(``)
  }

  // Error type
  lines.push(`// ============================================================================`)
  lines.push(`// Types`)
  lines.push(`// ============================================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * Error type for operation calls.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category errors`)
  lines.push(` */`)
  lines.push(`export type OperationsError =`)
  lines.push(`  | HttpClientError.HttpClientError`)
  lines.push(`  | ParseError`)
  if (!isV4) {
    lines.push(`  | SapError`)
  }
  lines.push(`  | ODataError`)
  lines.push(``)

  // Dependencies type
  lines.push(`/**`)
  lines.push(` * Dependencies required for operation calls.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category context`)
  lines.push(` */`)
  lines.push(`export type OperationsContext = ${versionConfig.clientConfigTag} | HttpClient.HttpClient`)
  lines.push(``)

  // Generate each operation
  lines.push(`// ============================================================================`)
  lines.push(`// Operations`)
  lines.push(`// ============================================================================`)
  lines.push(``)

  for (const operation of operations) {
    if (isV4) {
      generateV4Operation(lines, operation, dataModel)
    } else {
      generateV2FunctionImport(lines, operation, dataModel)
    }
    lines.push(``)
  }

  return lines.join("\n")
}

/**
 * Generate parameter interface for an operation.
 */
const generateParameterType = (
  operation: OperationModel
): string | null => {
  if (operation.parameters.length === 0) return null

  const typeName = `${toPascalCase(operation.odataName)}Params`
  return typeName
}

/**
 * Generate parameter interface definition.
 */
const generateParameterInterface = (
  lines: Array<string>,
  operation: OperationModel
): void => {
  if (operation.parameters.length === 0) return

  const typeName = `${toPascalCase(operation.odataName)}Params`

  lines.push(`/**`)
  lines.push(` * Parameters for ${operation.odataName} operation.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category params`)
  lines.push(` */`)
  lines.push(`export interface ${typeName} {`)

  for (const param of operation.parameters) {
    const optionalMark = param.isNullable ? "?" : ""
    const tsType = param.isCollection
      ? `ReadonlyArray<${param.typeMapping.tsType}>`
      : param.typeMapping.tsType
    lines.push(`  readonly ${param.name}${optionalMark}: ${tsType}`)
  }

  lines.push(`}`)
  lines.push(``)
}

/**
 * Build the parameters object mapping TypeScript names to OData names.
 */
const generateParametersObject = (
  lines: Array<string>,
  params: ReadonlyArray<OperationParameterModel>,
  indent: string
): void => {
  lines.push(`${indent}const parameters: ODataOps.OperationParameters = {`)
  for (const param of params) {
    // Map TypeScript param name to OData param name
    if (param.name === param.odataName) {
      lines.push(`${indent}  ${param.name}: params.${param.name},`)
    } else {
      lines.push(`${indent}  "${param.odataName}": params.${param.name},`)
    }
  }
  lines.push(`${indent}}`)
}

/**
 * Generate V2 FunctionImport function.
 */
const generateV2FunctionImport = (
  lines: Array<string>,
  operation: OperationModel,
  dataModel: DataModel
): void => {
  const fnName = getOperationFunctionName(operation)
  const paramsType = generateParameterType(operation)
  const returnType = getReturnTypeName(operation)
  const returnsModel = returnsModelType(operation, dataModel)

  // Generate parameter interface if needed
  generateParameterInterface(lines, operation)

  lines.push(`/**`)
  lines.push(` * Execute the ${operation.odataName} function import.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category operations`)
  lines.push(` */`)

  // Function signature
  if (paramsType) {
    lines.push(`export const ${fnName} = (`)
    lines.push(`  params: ${paramsType}`)
    lines.push(`): Effect.Effect<`)
  } else {
    lines.push(`export const ${fnName} = (): Effect.Effect<`)
  }

  lines.push(`  ${returnType},`)
  lines.push(`  OperationsError,`)
  lines.push(`  OperationsContext`)
  lines.push(`> =>`)
  lines.push(`  Effect.gen(function*() {`)
  lines.push(`    const config = yield* ${V2_CONFIG.clientConfigImport}`)
  lines.push(`    const client = yield* HttpClient.HttpClient`)
  lines.push(``)

  // Build parameters object for the function import URL
  if (paramsType) {
    generateParametersObject(lines, operation.parameters, "    ")
    lines.push(``)
  }

  const paramsArg = paramsType ? "parameters" : "undefined"

  // Determine the execute function to use
  if (!operation.returnType) {
    lines.push(
      `    return yield* ODataOps.executeFunctionImportVoid(client, config, "${operation.odataName}", ${paramsArg})`
    )
  } else if (operation.returnType.isCollection) {
    if (returnsModel) {
      lines.push(
        `    return yield* ODataOps.executeFunctionImportCollection(client, config, "${operation.odataName}", ${operation.returnType.typeMapping.tsType}, ${paramsArg})`
      )
    } else {
      lines.push(
        `    return yield* ODataOps.executeFunctionImportCollection(client, config, "${operation.odataName}", ${operation.returnType.typeMapping.effectSchema}, ${paramsArg})`
      )
    }
  } else if (returnsModel) {
    lines.push(
      `    return yield* ODataOps.executeFunctionImportEntity(client, config, "${operation.odataName}", ${operation.returnType.typeMapping.tsType}, ${paramsArg})`
    )
  } else {
    // Primitive return
    const propertyName = operation.odataName
    lines.push(
      `    return yield* ODataOps.executeFunctionImportPrimitive(client, config, "${operation.odataName}", "${propertyName}", ${operation.returnType.typeMapping.effectSchema}, ${paramsArg})`
    )
  }

  lines.push(`  })`)
}

/**
 * Generate V4 Function or Action.
 */
const generateV4Operation = (
  lines: Array<string>,
  operation: OperationModel,
  dataModel: DataModel
): void => {
  const fnName = getOperationFunctionName(operation)
  const paramsType = generateParameterType(operation)
  const returnType = getReturnTypeName(operation)
  const returnsModel = returnsModelType(operation, dataModel)
  const isAction = operation.type === "Action"

  // Generate parameter interface if needed
  generateParameterInterface(lines, operation)

  lines.push(`/**`)
  lines.push(` * Execute the ${operation.odataName} ${operation.type.toLowerCase()}.`)
  lines.push(` *`)
  lines.push(` * @since 1.0.0`)
  lines.push(` * @category operations`)
  lines.push(` */`)

  // Function signature
  if (paramsType) {
    lines.push(`export const ${fnName} = (`)
    lines.push(`  params: ${paramsType}`)
    lines.push(`): Effect.Effect<`)
  } else {
    lines.push(`export const ${fnName} = (): Effect.Effect<`)
  }

  lines.push(`  ${returnType},`)
  lines.push(`  OperationsError,`)
  lines.push(`  OperationsContext`)
  lines.push(`> =>`)
  lines.push(`  Effect.gen(function*() {`)
  lines.push(`    const config = yield* ${V4_CONFIG.clientConfigImport}`)
  lines.push(`    const client = yield* HttpClient.HttpClient`)
  lines.push(``)

  // Build URL for functions or action
  if (!isAction) {
    // V4 Functions use GET with parameters in URL
    if (paramsType) {
      generateParametersObject(lines, operation.parameters, "    ")
      lines.push(`    const url = ODataOps.buildV4FunctionUrl("${operation.odataName}", parameters)`)
    } else {
      lines.push(`    const url = ODataOps.buildV4FunctionUrl("${operation.odataName}")`)
    }
    lines.push(``)

    // Determine the execute function to use
    if (!operation.returnType) {
      lines.push(`    return yield* ODataOps.executeV4FunctionVoid(client, config, url)`)
    } else if (operation.returnType.isCollection) {
      if (returnsModel) {
        lines.push(
          `    return yield* ODataOps.executeV4FunctionCollection(client, config, url, ${operation.returnType.typeMapping.tsType})`
        )
      } else {
        lines.push(
          `    return yield* ODataOps.executeV4FunctionCollection(client, config, url, ${operation.returnType.typeMapping.effectSchema})`
        )
      }
    } else if (returnsModel) {
      lines.push(
        `    return yield* ODataOps.executeV4FunctionEntity(client, config, url, ${operation.returnType.typeMapping.tsType})`
      )
    } else {
      // Primitive return
      lines.push(
        `    return yield* ODataOps.executeV4FunctionPrimitive(client, config, url, ${operation.returnType.typeMapping.effectSchema})`
      )
    }
  } else {
    // V4 Actions use POST with body
    lines.push(`    const url = "${operation.odataName}"`)
    lines.push(``)

    // Build body with OData parameter names
    let bodyArg = "undefined"
    if (paramsType) {
      // Check if any parameter names differ
      const hasDifferentNames = operation.parameters.some((p) => p.name !== p.odataName)
      if (hasDifferentNames) {
        lines.push(`    const body = {`)
        for (const param of operation.parameters) {
          if (param.name === param.odataName) {
            lines.push(`      ${param.name}: params.${param.name},`)
          } else {
            lines.push(`      "${param.odataName}": params.${param.name},`)
          }
        }
        lines.push(`    }`)
        lines.push(``)
        bodyArg = "body"
      } else {
        bodyArg = "params"
      }
    }

    if (!operation.returnType) {
      lines.push(`    return yield* ODataOps.executeV4ActionVoid(client, config, url, ${bodyArg})`)
    } else if (operation.returnType.isCollection) {
      if (returnsModel) {
        lines.push(
          `    return yield* ODataOps.executeV4ActionCollection(client, config, url, ${operation.returnType.typeMapping.tsType}, ${bodyArg})`
        )
      } else {
        lines.push(
          `    return yield* ODataOps.executeV4ActionCollection(client, config, url, ${operation.returnType.typeMapping.effectSchema}, ${bodyArg})`
        )
      }
    } else if (returnsModel) {
      lines.push(
        `    return yield* ODataOps.executeV4ActionEntity(client, config, url, ${operation.returnType.typeMapping.tsType}, ${bodyArg})`
      )
    } else {
      // Primitive return - use entity with schema
      lines.push(
        `    return yield* ODataOps.executeV4FunctionPrimitive(client, config, url, ${operation.returnType.typeMapping.effectSchema})`
      )
    }
  }

  lines.push(`  })`)
}

/**
 * Assemble granular runtime modules and backwards-compatible ESM facades.
 * @since 1.3.0
 */
import type { DataModel } from "../model/DataModel.js"
import { generateIndex } from "./IndexGenerator.js"
import { generateModels } from "./ModelsGenerator.js"
import { formatRelativeImport } from "./NamingHelper.js"
import { generateNavigations } from "./NavigationGenerator.js"
import { generateOperations } from "./OperationsGenerator.js"
import { generateQueryModels } from "./QueryModelsGenerator.js"
import { generateServiceFns } from "./ServiceFnGenerator.js"

/** A generated source module, relative to the source directory. @since 1.3.0 */
export interface SourceFile {
  readonly fileName: string
  readonly content: string
}

/**
 * Allocate portable filenames, including on case-insensitive filesystems.
 * Input is sorted by metadata identity before allocation; suffixes resolve both
 * sanitized-name and case collisions without changing public identifiers.
 */
const moduleNames = (entries: ReadonlyArray<readonly [string, string]>, prefix: string): Map<string, string> => {
  const used = new Set<string>()
  return new Map(
    [...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([id, name]) => {
      const base = `${prefix}.${name.replace(/[^A-Za-z0-9_$]/g, "_")}`
      let candidate = base
      let suffix = 2
      while (used.has(candidate.toLowerCase())) candidate = `${base}_${suffix++}`
      used.add(candidate.toLowerCase())
      return [id, candidate]
    })
  )
}

/**
 * Generate source files. The single-file template APIs remain available for
 * callers that explicitly assemble legacy output themselves.
 * @since 1.3.0
 * @category generation
 */
export const generateSourceFiles = (
  model: DataModel,
  options: { readonly esmExtensions: boolean }
): Array<SourceFile> => {
  const files: Array<SourceFile> = []
  const specifier = (name: string) => formatRelativeImport(name, options.esmExtensions)
  const types = [...model.enumTypes.values(), ...model.complexTypes.values(), ...model.entityTypes.values()]
  const typesById = new Map(types.map((type) => [type.fqName, type]))
  const names = moduleNames(types.map((type) => [type.fqName, type.name]), "Models")
  const schemaModules = new Map<string, string>()
  for (const type of types) {
    const module = names.get(type.fqName)!
    schemaModules.set(type.name, module)
    if ("properties" in type) schemaModules.set(`Editable${type.name}`, module)
    if (model.entityTypes.has(type.fqName)) {
      schemaModules.set(`Create${type.name}`, module)
      schemaModules.set(`PartialEditable${type.name}`, module)
      if (model.entityTypes.get(type.fqName)!.keys.length) schemaModules.set(`${type.name}Id`, module)
    }
  }

  // These imports are emitted by our templates (not arbitrary consumer source).
  // Resolve each binding to its metadata module instead of the Models facade.
  const narrowModelImports = (content: string): string =>
    content.replace(
      /import \{([^}]+)\} from "\.\/Models(?:\.js)?"/g,
      (_, bindings: string) =>
        bindings.split(",").map((binding) => {
          const name = binding.trim()
          const symbol = name.replace(/^type /, "")
          const module = schemaModules.get(symbol)
          if (!module) throw new Error(`No generated schema module for ${symbol}`)
          return `import { ${name} } from "${specifier(module)}"`
        }).join("\n")
    )

  const modelExports: Array<string> = []
  for (const [id, module] of names) {
    const type = typesById.get(id)!
    const subset: DataModel = {
      ...model,
      enumTypes: new Map(model.enumTypes.has(id) ? [[id, model.enumTypes.get(id)!]] : []),
      complexTypes: new Map(model.complexTypes.has(id) ? [[id, model.complexTypes.get(id)!]] : []),
      entityTypes: new Map(model.entityTypes.has(id) ? [[id, model.entityTypes.get(id)!]] : [])
    }
    // Inheritance is already flattened by the digester. Only actual fields
    // contribute runtime edges, not the otherwise unused base schema value.
    const dependencies = new Set<string>()
    if ("properties" in type) {
      for (const property of type.properties) {
        if (schemaModules.has(property.typeMapping.effectSchema)) dependencies.add(property.typeMapping.effectSchema)
      }
      for (const navigation of type.navigationProperties) dependencies.add(navigation.targetType)
    }
    dependencies.delete(type.name)
    const imports = [...dependencies].sort().map((dependency) => {
      const target = schemaModules.get(dependency)
      if (!target) throw new Error(`Unknown schema dependency ${dependency} in ${type.fqName}`)
      return `import { ${dependency} } from "${specifier(target)}"`
    })
    files.push({ fileName: `${module}.ts`, content: `${imports.join("\n")}\n${generateModels(subset)}` })
    modelExports.push(`export * from "${specifier(module)}"`)
  }
  files.push({ fileName: "Models.ts", content: modelExports.join("\n") + "\n" })

  const operations = [...model.operations.entries()].filter(([, operation]) => !operation.isBound)
  const operationNames = moduleNames(operations.map(([id, operation]) => [id, operation.name]), "Operations")
  const operationExports: Array<string> = []
  for (const [id, module] of operationNames) {
    const operation = model.operations.get(id)!
    const result = generateOperations({ ...model, operations: new Map([[id, operation]]) }, options)
    files.push({ fileName: `${module}.ts`, content: narrowModelImports(result.operationsFile!.content) })
    if (operationExports.length === 0) {
      operationExports.push(`export type { OperationsError, OperationsContext } from "${specifier(module)}"`)
    }
    operationExports.push(`export * from "${specifier(module)}"`)
  }
  if (operations.length) files.push({ fileName: "Operations.ts", content: operationExports.join("\n") + "\n" })

  const serviceNames = moduleNames([...model.entitySets].map(([id, set]) => [id, set.name]), "Services")
  const crudModule = model.version === "V4" ? "CrudV4" : "Crud"
  const serviceExports = [
    `export type { CrudError, CrudContext, CrudService } from "@odata-effect/odata-effect/${crudModule}"`
  ]
  for (const [id, module] of serviceNames) {
    const set = model.entitySets.get(id)!
    const result = generateServiceFns({ ...model, entitySets: new Map([[id, set]]) }, options)
    files.push({ fileName: `${module}.ts`, content: narrowModelImports(result.servicesFile.content) })
    serviceExports.push(`export * from "${specifier(module)}"`)
  }
  files.push({ fileName: "Services.ts", content: serviceExports.join("\n") + "\n" })
  // Both of these templates import model types only: no runtime schema edges.
  files.push({ fileName: "QueryModels.ts", content: generateQueryModels(model, options) })
  for (const file of generateNavigations(model, options).navigationFiles) files.push(file)
  files.push({ fileName: "index.ts", content: generateIndex(model, options) })
  return files
}

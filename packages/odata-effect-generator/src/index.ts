/**
 * OData Effect Generator - Generate Effect-based OData clients from metadata.
 *
 * @since 1.0.0
 */

// Parser
export {
  type ComplexType,
  detectODataVersion,
  type EntityContainer,
  type EntityType,
  type EnumType,
  type NavigationProperty,
  type ODataEdmxModel,
  type ODataVersion,
  type Property,
  type Schema
} from "./parser/EdmxSchema.js"
export { parseODataMetadata, XmlParseError } from "./parser/XmlParser.js"

// Model
export {
  type ComplexTypeModel,
  createDataModel,
  type DataModel,
  type EntitySetModel,
  type EntityTypeModel,
  type EnumTypeModel,
  type NavigationPropertyModel,
  type OperationModel,
  type PropertyModel,
  type SingletonModel,
  type TypeMapping
} from "./model/DataModel.js"

// Digester
export { DigestError, digestMetadata } from "./digester/Digester.js"
export {
  getComplexTypeMapping,
  getEnumTypeMapping,
  getPrimitiveTypeMapping,
  getSimpleTypeName,
  isPrimitiveType,
  parseODataType
} from "./digester/TypeMapper.js"

// Generator
export { generate, type GeneratorConfig, GeneratorError } from "./generator/Generator.js"
export { generateIndex } from "./generator/IndexGenerator.js"
export { generateModels } from "./generator/ModelsGenerator.js"
export {
  generatePackageJson,
  generateTsconfig,
  generateTsconfigBuild,
  generateTsconfigSrc,
  generateTsconfigTest,
  generateVitestConfig,
  type PackageConfig
} from "./generator/PackageGenerator.js"
export { generateQueryModels } from "./generator/QueryModelsGenerator.js"
export {
  type GeneratedServiceFnFile,
  generateServiceFns,
  type ServiceFnGenerationResult
} from "./generator/ServiceFnGenerator.js"
export {
  type GeneratedPromiseServiceFile,
  generatePromiseServiceFns,
  getPromiseServiceName,
  type PromiseServiceGenerationResult
} from "./generator/ServiceFnPromiseGenerator.js"

// Naming
export {
  getClassName,
  getEditableTypeName,
  getIdTypeName,
  getPropertyName,
  getQueryFactoryName,
  getQueryInstanceName,
  getQueryInterfaceName,
  getServiceClassName,
  toCamelCase,
  toPascalCase,
  toValidIdentifier
} from "./generator/NamingHelper.js"

// CLI
export { cli } from "./Cli.js"

/**
 * OData Effect Generator - Generate Effect-based OData clients from metadata.
 *
 * @since 1.0.0
 */

// Parser
export { parseODataMetadata, XmlParseError } from "./parser/XmlParser.js"
export {
  type ODataEdmxModel,
  type Schema,
  type EntityType,
  type ComplexType,
  type EnumType,
  type Property,
  type NavigationProperty,
  type EntityContainer,
  type ODataVersion,
  detectODataVersion
} from "./parser/EdmxSchema.js"

// Model
export {
  type DataModel,
  type EntityTypeModel,
  type ComplexTypeModel,
  type EnumTypeModel,
  type PropertyModel,
  type NavigationPropertyModel,
  type EntitySetModel,
  type SingletonModel,
  type OperationModel,
  type TypeMapping,
  createDataModel
} from "./model/DataModel.js"

// Digester
export { digestMetadata, DigestError } from "./digester/Digester.js"
export {
  parseODataType,
  isPrimitiveType,
  getPrimitiveTypeMapping,
  getComplexTypeMapping,
  getEnumTypeMapping,
  getSimpleTypeName
} from "./digester/TypeMapper.js"

// Generator
export { generate, GeneratorError, type GeneratorConfig } from "./generator/Generator.js"
export { generateModels } from "./generator/ModelsGenerator.js"
export { generateQueryModels } from "./generator/QueryModelsGenerator.js"
export { generateServiceFns, type GeneratedServiceFnFile, type ServiceFnGenerationResult } from "./generator/ServiceFnGenerator.js"
export { generatePromiseServiceFns, getPromiseServiceName, type GeneratedPromiseServiceFile, type PromiseServiceGenerationResult } from "./generator/ServiceFnPromiseGenerator.js"
export { generateIndex } from "./generator/IndexGenerator.js"
export {
  generatePackageJson,
  generateTsconfig,
  generateTsconfigSrc,
  generateTsconfigTest,
  generateTsconfigBuild,
  generateVitestConfig,
  type PackageConfig
} from "./generator/PackageGenerator.js"

// Naming
export {
  toPascalCase,
  toCamelCase,
  toValidIdentifier,
  getPropertyName,
  getClassName,
  getServiceClassName,
  getQueryInterfaceName,
  getQueryInstanceName,
  getQueryFactoryName,
  getEditableTypeName,
  getIdTypeName
} from "./generator/NamingHelper.js"

// CLI
export { cli } from "./Cli.js"

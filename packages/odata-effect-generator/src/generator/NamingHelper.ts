/**
 * Naming utilities for code generation.
 *
 * @since 1.0.0
 */

/**
 * Convert a string to PascalCase.
 *
 * @example
 * toPascalCase("hello_world") // "HelloWorld"
 * toPascalCase("helloWorld") // "HelloWorld"
 *
 * @since 1.0.0
 * @category naming
 */
export const toPascalCase = (str: string): string => {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toUpperCase())
}

/**
 * Convert a string to camelCase.
 *
 * @example
 * toCamelCase("HelloWorld") // "helloWorld"
 * toCamelCase("hello_world") // "helloWorld"
 *
 * @since 1.0.0
 * @category naming
 */
export const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Ensure a string is a valid TypeScript identifier.
 * Prefixes with underscore if it starts with a number.
 *
 * @since 1.0.0
 * @category naming
 */
export const toValidIdentifier = (str: string): string => {
  // If starts with a number, prefix with underscore
  if (/^[0-9]/.test(str)) {
    return `_${str}`
  }
  // Replace invalid characters with underscores
  return str.replace(/[^a-zA-Z0-9_$]/g, "_")
}

/**
 * Get the TypeScript property name for an OData property.
 *
 * @since 1.0.0
 * @category naming
 */
export const getPropertyName = (odataName: string): string => {
  return toCamelCase(toValidIdentifier(odataName))
}

/**
 * Get the TypeScript class name for an OData entity or complex type.
 *
 * @since 1.0.0
 * @category naming
 */
export const getClassName = (odataName: string): string => {
  return toPascalCase(toValidIdentifier(odataName))
}

/**
 * Get the service class name for an entity set.
 *
 * @example
 * getServiceClassName("Products") // "ProductService"
 *
 * @since 1.0.0
 * @category naming
 */
export const getServiceClassName = (entitySetName: string): string => {
  // Remove trailing 's' if present to singularize
  let singular = entitySetName
  if (singular.endsWith("ies")) {
    // "Categories" -> "Category"
    singular = singular.slice(0, -3) + "y"
  } else if (singular.endsWith("xes") || singular.endsWith("ches") ||
             singular.endsWith("shes") || singular.endsWith("sses") ||
             singular.endsWith("zes")) {
    // "Boxes" -> "Box", "Beaches" -> "Beach", etc.
    singular = singular.slice(0, -2)
  } else if (singular.endsWith("s") && !singular.endsWith("ss")) {
    // "Products" -> "Product", "Airlines" -> "Airline"
    singular = singular.slice(0, -1)
  }
  return `${toPascalCase(singular)}Service`
}

/**
 * Get the query paths interface name for a type.
 *
 * @example
 * getQueryInterfaceName("Product") // "QProduct"
 *
 * @since 1.0.0
 * @category naming
 */
export const getQueryInterfaceName = (typeName: string): string => {
  return `Q${toPascalCase(typeName)}`
}

/**
 * Get the query paths instance name for a type.
 *
 * @example
 * getQueryInstanceName("Product") // "qProduct"
 *
 * @since 1.0.0
 * @category naming
 */
export const getQueryInstanceName = (typeName: string): string => {
  return `q${toPascalCase(typeName)}`
}

/**
 * Get the query builder factory function name for a type.
 *
 * @example
 * getQueryFactoryName("Product") // "productQuery"
 *
 * @since 1.0.0
 * @category naming
 */
export const getQueryFactoryName = (typeName: string): string => {
  return `${toCamelCase(typeName)}Query`
}

/**
 * Get the editable type name for an entity type.
 *
 * @example
 * getEditableTypeName("Product") // "EditableProduct"
 *
 * @since 1.0.0
 * @category naming
 */
export const getEditableTypeName = (typeName: string): string => {
  return `Editable${toPascalCase(typeName)}`
}

/**
 * Get the ID type name for an entity type.
 *
 * @example
 * getIdTypeName("Product") // "ProductId"
 *
 * @since 1.0.0
 * @category naming
 */
export const getIdTypeName = (typeName: string): string => {
  return `${toPascalCase(typeName)}Id`
}

/**
 * Type-safe OData query builder using Effect Schema.
 *
 * This module provides a type-safe way to build OData queries based on
 * Effect Schema definitions. It uses the schema's structure to provide
 * compile-time type safety for $select, $filter, $expand, and $orderby.
 *
 * @since 1.0.0
 */
import type * as BigDecimal from "effect/BigDecimal"
import type * as DateTime from "effect/DateTime"
import type * as Duration from "effect/Duration"
import type { Int64 } from "./ODataSchema.js"
import { formatV2UrlValue } from "./ODataUrlFormat.js"

// ============================================================================
// Filter Expressions
// ============================================================================

/**
 * Represents an OData filter expression.
 *
 * @since 1.0.0
 * @category filter
 */
export class FilterExpression {
  constructor(readonly expression: string) {}

  /**
   * Combines this filter with another using AND.
   */
  and(other: FilterExpression): FilterExpression {
    return new FilterExpression(`(${this.expression}) and (${other.expression})`)
  }

  /**
   * Combines this filter with another using OR.
   */
  or(other: FilterExpression): FilterExpression {
    return new FilterExpression(`(${this.expression}) or (${other.expression})`)
  }

  /**
   * Negates this filter.
   */
  not(): FilterExpression {
    return new FilterExpression(`not (${this.expression})`)
  }

  toString(): string {
    return this.expression
  }
}

// ============================================================================
// Path Classes for Type-Safe Filtering
// ============================================================================

/**
 * Base path class for all property paths.
 *
 * @since 1.0.0
 * @category paths
 */
abstract class BasePath {
  constructor(readonly path: string) {}

  /**
   * Check if the value is null.
   */
  isNull(): FilterExpression {
    return new FilterExpression(`${this.path} eq null`)
  }

  /**
   * Check if the value is not null.
   */
  isNotNull(): FilterExpression {
    return new FilterExpression(`${this.path} ne null`)
  }
}

/**
 * Path class for string properties.
 *
 * @since 1.0.0
 * @category paths
 */
export class StringPath extends BasePath {
  eq(value: string): FilterExpression {
    return new FilterExpression(`${this.path} eq '${this.escapeString(value)}'`)
  }

  ne(value: string): FilterExpression {
    return new FilterExpression(`${this.path} ne '${this.escapeString(value)}'`)
  }

  contains(value: string): FilterExpression {
    return new FilterExpression(`contains(${this.path},'${this.escapeString(value)}')`)
  }

  startsWith(value: string): FilterExpression {
    return new FilterExpression(`startswith(${this.path},'${this.escapeString(value)}')`)
  }

  endsWith(value: string): FilterExpression {
    return new FilterExpression(`endswith(${this.path},'${this.escapeString(value)}')`)
  }

  toLower(): StringPath {
    return new StringPath(`tolower(${this.path})`)
  }

  toUpper(): StringPath {
    return new StringPath(`toupper(${this.path})`)
  }

  trim(): StringPath {
    return new StringPath(`trim(${this.path})`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }

  private escapeString(value: string): string {
    return value.replace(/'/g, "''")
  }
}

/**
 * Path class for numeric properties.
 *
 * @since 1.0.0
 * @category paths
 */
export class NumberPath extends BasePath {
  eq(value: number): FilterExpression {
    return new FilterExpression(`${this.path} eq ${value}`)
  }

  ne(value: number): FilterExpression {
    return new FilterExpression(`${this.path} ne ${value}`)
  }

  gt(value: number): FilterExpression {
    return new FilterExpression(`${this.path} gt ${value}`)
  }

  ge(value: number): FilterExpression {
    return new FilterExpression(`${this.path} ge ${value}`)
  }

  lt(value: number): FilterExpression {
    return new FilterExpression(`${this.path} lt ${value}`)
  }

  le(value: number): FilterExpression {
    return new FilterExpression(`${this.path} le ${value}`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }
}

/**
 * Path class for boolean properties.
 *
 * @since 1.0.0
 * @category paths
 */
export class BooleanPath extends BasePath {
  eq(value: boolean): FilterExpression {
    return new FilterExpression(`${this.path} eq ${value}`)
  }

  ne(value: boolean): FilterExpression {
    return new FilterExpression(`${this.path} ne ${value}`)
  }

  isTrue(): FilterExpression {
    return this.eq(true)
  }

  isFalse(): FilterExpression {
    return this.eq(false)
  }
}

/**
 * Supported date/time value types for filtering.
 *
 * @since 1.0.0
 * @category types
 */
export type DateTimeValue = Date | DateTime.DateTime

/**
 * Path class for Date/DateTime properties.
 *
 * Supports both JavaScript Date and Effect DateTime types (DateTime.Utc, DateTime.Zoned).
 *
 * @since 1.0.0
 * @category paths
 */
export class DateTimePath extends BasePath {
  eq(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} eq ${formatV2UrlValue(value)}`)
  }

  ne(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} ne ${formatV2UrlValue(value)}`)
  }

  gt(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} gt ${formatV2UrlValue(value)}`)
  }

  ge(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} ge ${formatV2UrlValue(value)}`)
  }

  lt(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} lt ${formatV2UrlValue(value)}`)
  }

  le(value: DateTimeValue): FilterExpression {
    return new FilterExpression(`${this.path} le ${formatV2UrlValue(value)}`)
  }

  /**
   * Get the year component.
   */
  year(): NumberPath {
    return new NumberPath(`year(${this.path})`)
  }

  /**
   * Get the month component.
   */
  month(): NumberPath {
    return new NumberPath(`month(${this.path})`)
  }

  /**
   * Get the day component.
   */
  day(): NumberPath {
    return new NumberPath(`day(${this.path})`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }
}

/**
 * Path class for Duration properties.
 *
 * Supports Effect Duration type for OData V2 Edm.Time fields.
 *
 * @since 1.0.0
 * @category paths
 */
export class DurationPath extends BasePath {
  eq(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} eq ${formatV2UrlValue(value)}`)
  }

  ne(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} ne ${formatV2UrlValue(value)}`)
  }

  gt(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} gt ${formatV2UrlValue(value)}`)
  }

  ge(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} ge ${formatV2UrlValue(value)}`)
  }

  lt(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} lt ${formatV2UrlValue(value)}`)
  }

  le(value: Duration.Duration): FilterExpression {
    return new FilterExpression(`${this.path} le ${formatV2UrlValue(value)}`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }
}

/**
 * Path class for Int64 properties.
 *
 * Supports OData Int64 type which wraps BigDecimal for precision.
 *
 * @since 1.0.0
 * @category paths
 */
export class Int64Path extends BasePath {
  eq(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} eq ${formatV2UrlValue(value)}`)
  }

  ne(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} ne ${formatV2UrlValue(value)}`)
  }

  gt(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} gt ${formatV2UrlValue(value)}`)
  }

  ge(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} ge ${formatV2UrlValue(value)}`)
  }

  lt(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} lt ${formatV2UrlValue(value)}`)
  }

  le(value: Int64): FilterExpression {
    return new FilterExpression(`${this.path} le ${formatV2UrlValue(value)}`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }
}

/**
 * Path class for BigDecimal (Decimal) properties.
 *
 * Supports Effect BigDecimal type for OData Edm.Decimal fields.
 *
 * @since 1.0.0
 * @category paths
 */
export class BigDecimalPath extends BasePath {
  eq(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} eq ${formatV2UrlValue(value)}`)
  }

  ne(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} ne ${formatV2UrlValue(value)}`)
  }

  gt(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} gt ${formatV2UrlValue(value)}`)
  }

  ge(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} ge ${formatV2UrlValue(value)}`)
  }

  lt(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} lt ${formatV2UrlValue(value)}`)
  }

  le(value: BigDecimal.BigDecimal): FilterExpression {
    return new FilterExpression(`${this.path} le ${formatV2UrlValue(value)}`)
  }

  /**
   * Ascending order expression.
   */
  asc(): string {
    return `${this.path} asc`
  }

  /**
   * Descending order expression.
   */
  desc(): string {
    return `${this.path} desc`
  }
}

/**
 * Path class for nested entity properties.
 *
 * @since 1.0.0
 * @category paths
 */
export class EntityPath<Q> extends BasePath {
  constructor(
    path: string,
    readonly getEntity: () => Q
  ) {
    super(path)
  }
}

/**
 * Path class for collection properties (supports any/all lambdas).
 *
 * @since 1.0.0
 * @category paths
 */
export class CollectionPath<Q> extends BasePath {
  constructor(
    path: string,
    readonly getEntity: () => Q
  ) {
    super(path)
  }

  /**
   * Returns true if any item in the collection matches the filter.
   */
  any(fn: (q: Q) => FilterExpression): FilterExpression {
    const entity = this.getEntity()
    // Create a prefixed version for lambda
    const prefixedEntity = this.createPrefixedEntity(entity, "a")
    const filter = fn(prefixedEntity)
    return new FilterExpression(`${this.path}/any(a:${filter.expression})`)
  }

  /**
   * Returns true if all items in the collection match the filter.
   */
  all(fn: (q: Q) => FilterExpression): FilterExpression {
    const entity = this.getEntity()
    const prefixedEntity = this.createPrefixedEntity(entity, "a")
    const filter = fn(prefixedEntity)
    return new FilterExpression(`${this.path}/all(a:${filter.expression})`)
  }

  private createPrefixedEntity(entity: Q, prefix: string): Q {
    // Create a new entity with prefixed paths
    const prefixed = {} as Record<string, unknown>
    for (const key of Object.keys(entity as object)) {
      const value = (entity as Record<string, unknown>)[key]
      if (value instanceof StringPath) {
        prefixed[key] = new StringPath(`${prefix}/${value.path}`)
      } else if (value instanceof NumberPath) {
        prefixed[key] = new NumberPath(`${prefix}/${value.path}`)
      } else if (value instanceof BooleanPath) {
        prefixed[key] = new BooleanPath(`${prefix}/${value.path}`)
      } else if (value instanceof DateTimePath) {
        prefixed[key] = new DateTimePath(`${prefix}/${value.path}`)
      } else if (value instanceof DurationPath) {
        prefixed[key] = new DurationPath(`${prefix}/${value.path}`)
      } else if (value instanceof Int64Path) {
        prefixed[key] = new Int64Path(`${prefix}/${value.path}`)
      } else if (value instanceof BigDecimalPath) {
        prefixed[key] = new BigDecimalPath(`${prefix}/${value.path}`)
      }
    }
    return prefixed as Q
  }
}

// ============================================================================
// Query Paths Type - Derived from Schema
// ============================================================================

/**
 * Maps a schema field type to the appropriate path type.
 *
 * @since 1.0.0
 * @category types
 */
export type FieldToPath<T> = T extends string ? StringPath
  : T extends number ? NumberPath
  : T extends boolean ? BooleanPath
  : T extends Date ? DateTimePath
  : T extends DateTime.DateTime ? DateTimePath // Effect DateTime.Utc and DateTime.Zoned
  : T extends Duration.Duration ? DurationPath // Effect Duration
  : T extends Int64 ? Int64Path // OData Int64
  : T extends BigDecimal.BigDecimal ? BigDecimalPath // Effect BigDecimal (OData Decimal)
  : T extends ReadonlyArray<infer U> ? U extends object ? CollectionPath<QueryPaths<U>>
    : StringPath // Arrays of primitives use StringPath for filter operations
  : T extends object ? EntityPath<QueryPaths<T>>
  : StringPath // Unknown types use StringPath

/**
 * Creates query paths type from a schema type.
 *
 * @since 1.0.0
 * @category types
 */
export type QueryPaths<T> = {
  readonly [K in keyof T as T[K] extends (...args: Array<unknown>) => unknown ? never : K]: FieldToPath<T[K]>
}

/**
 * Extracts property keys that can be selected (non-navigation properties).
 *
 * @since 1.0.0
 * @category types
 */
export type SelectableKeys<T> = {
  [K in keyof T]: T[K] extends ReadonlyArray<any> ? never
    : T[K] extends object ? T[K] extends Date ? K
      : never
    : K
}[keyof T]

/**
 * Extracts property keys that can be expanded (navigation properties).
 *
 * @since 1.0.0
 * @category types
 */
export type ExpandableKeys<T> = {
  [K in keyof T]: NonNullable<T[K]> extends ReadonlyArray<any> ? K
    : NonNullable<T[K]> extends object ? NonNullable<T[K]> extends Date ? never
      : K
    : never
}[keyof T]

// ============================================================================
// Query Builder
// ============================================================================

/**
 * Built query options ready to be passed to OData client.
 *
 * @since 1.0.0
 * @category models
 */
export interface BuiltQuery {
  readonly $filter?: string
  readonly $select?: string
  readonly $expand?: string
  readonly $orderby?: string
  readonly $top?: number
  readonly $skip?: number
}

/**
 * Type-safe OData query builder.
 *
 * @since 1.0.0
 * @category builders
 */
export class QueryBuilder<T, Q extends QueryPaths<T>> {
  private _filters: Array<FilterExpression> = []
  private _selects: Array<string> = []
  private _expands: Array<string> = []
  private _orderBy: Array<string> = []
  private _top?: number
  private _skip?: number

  constructor(readonly paths: Q) {}

  /**
   * Add a filter expression.
   */
  filter(
    fn: (q: Q) => FilterExpression | ReadonlyArray<FilterExpression>
  ): QueryBuilder<T, Q> {
    const result = fn(this.paths)
    if (Array.isArray(result)) {
      for (const item of result) this._filters.push(item)
    } else {
      this._filters.push(result as FilterExpression)
    }
    return this
  }

  /**
   * Select specific properties.
   */
  select(...props: Array<SelectableKeys<T> & string>): QueryBuilder<T, Q> {
    for (const prop of props) this._selects.push(prop)
    return this
  }

  /**
   * Expand navigation properties.
   */
  expand(...props: Array<ExpandableKeys<T> & string>): QueryBuilder<T, Q> {
    for (const prop of props) this._expands.push(prop)
    return this
  }

  /**
   * Add ordering.
   */
  orderBy(
    fn: (q: Q) => string | ReadonlyArray<string>
  ): QueryBuilder<T, Q> {
    const result = fn(this.paths)
    if (Array.isArray(result)) {
      for (const item of result) this._orderBy.push(item)
    } else {
      this._orderBy.push(result as string)
    }
    return this
  }

  /**
   * Limit the number of results.
   */
  top(count: number): QueryBuilder<T, Q> {
    this._top = count
    return this
  }

  /**
   * Skip a number of results.
   */
  skip(count: number): QueryBuilder<T, Q> {
    this._skip = count
    return this
  }

  /**
   * Build the query options.
   */
  build(): BuiltQuery {
    const query: BuiltQuery = {}

    if (this._filters.length > 0) {
      ;(query as any).$filter = this._filters
        .map((f) => f.expression)
        .join(" and ")
    }

    if (this._selects.length > 0) {
      ;(query as any).$select = this._selects.join(",")
    }

    if (this._expands.length > 0) {
      ;(query as any).$expand = this._expands.join(",")
    }

    if (this._orderBy.length > 0) {
      ;(query as any).$orderby = this._orderBy.join(",")
    }

    if (this._top !== undefined) {
      ;(query as any).$top = this._top
    }

    if (this._skip !== undefined) {
      ;(query as any).$skip = this._skip
    }

    return query
  }
}

// ============================================================================
// Query Paths Factory
// ============================================================================

/**
 * Creates query paths from a schema type.
 * This is a helper to create the paths object for a given entity type.
 *
 * @since 1.0.0
 * @category constructors
 */
export const createQueryPaths = <T>(
  fields: { [K in keyof T]: "string" | "number" | "boolean" | "date" | "entity" | "collection" }
): QueryPaths<T> => {
  const paths: any = {}

  for (const [key, type] of Object.entries(fields)) {
    switch (type) {
      case "string":
        paths[key] = new StringPath(key)
        break
      case "number":
        paths[key] = new NumberPath(key)
        break
      case "boolean":
        paths[key] = new BooleanPath(key)
        break
      case "date":
        paths[key] = new DateTimePath(key)
        break
        // entity and collection need special handling with getEntity callback
    }
  }

  return paths as QueryPaths<T>
}

/**
 * Creates a new query builder for an entity type.
 *
 * @since 1.0.0
 * @category constructors
 */
export const createQueryBuilder = <T, Q extends QueryPaths<T>>(
  paths: Q
): QueryBuilder<T, Q> => new QueryBuilder(paths)

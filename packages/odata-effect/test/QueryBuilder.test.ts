import { describe, expect, it } from "@effect/vitest"
import {
  FilterExpression,
  StringPath,
  NumberPath,
  BooleanPath,
  DateTimePath,
  EntityPath,
  CollectionPath,
  createQueryBuilder
} from "../src/QueryBuilder.js"

describe("QueryBuilder", () => {
  describe("FilterExpression", () => {
    it("combines expressions with AND", () => {
      const expr1 = new FilterExpression("name eq 'John'")
      const expr2 = new FilterExpression("age gt 18")
      const combined = expr1.and(expr2)
      expect(combined.toString()).toBe("(name eq 'John') and (age gt 18)")
    })

    it("combines expressions with OR", () => {
      const expr1 = new FilterExpression("status eq 'active'")
      const expr2 = new FilterExpression("status eq 'pending'")
      const combined = expr1.or(expr2)
      expect(combined.toString()).toBe("(status eq 'active') or (status eq 'pending')")
    })

    it("negates expressions", () => {
      const expr = new FilterExpression("deleted eq true")
      const negated = expr.not()
      expect(negated.toString()).toBe("not (deleted eq true)")
    })
  })

  describe("StringPath", () => {
    const path = new StringPath("name")

    it("generates eq filter", () => {
      expect(path.eq("John").toString()).toBe("name eq 'John'")
    })

    it("generates ne filter", () => {
      expect(path.ne("John").toString()).toBe("name ne 'John'")
    })

    it("generates contains filter", () => {
      expect(path.contains("oh").toString()).toBe("contains(name,'oh')")
    })

    it("generates startsWith filter", () => {
      expect(path.startsWith("Jo").toString()).toBe("startswith(name,'Jo')")
    })

    it("generates endsWith filter", () => {
      expect(path.endsWith("hn").toString()).toBe("endswith(name,'hn')")
    })

    it("escapes single quotes in values", () => {
      expect(path.eq("O'Brien").toString()).toBe("name eq 'O''Brien'")
    })

    it("generates toLower transformation", () => {
      const lower = path.toLower()
      expect(lower.eq("john").toString()).toBe("tolower(name) eq 'john'")
    })

    it("generates toUpper transformation", () => {
      const upper = path.toUpper()
      expect(upper.eq("JOHN").toString()).toBe("toupper(name) eq 'JOHN'")
    })

    it("generates trim transformation", () => {
      const trimmed = path.trim()
      expect(trimmed.eq("John").toString()).toBe("trim(name) eq 'John'")
    })

    it("generates ascending order", () => {
      expect(path.asc()).toBe("name asc")
    })

    it("generates descending order", () => {
      expect(path.desc()).toBe("name desc")
    })

    it("generates isNull filter", () => {
      expect(path.isNull().toString()).toBe("name eq null")
    })

    it("generates isNotNull filter", () => {
      expect(path.isNotNull().toString()).toBe("name ne null")
    })
  })

  describe("NumberPath", () => {
    const path = new NumberPath("age")

    it("generates eq filter", () => {
      expect(path.eq(25).toString()).toBe("age eq 25")
    })

    it("generates ne filter", () => {
      expect(path.ne(25).toString()).toBe("age ne 25")
    })

    it("generates gt filter", () => {
      expect(path.gt(18).toString()).toBe("age gt 18")
    })

    it("generates ge filter", () => {
      expect(path.ge(18).toString()).toBe("age ge 18")
    })

    it("generates lt filter", () => {
      expect(path.lt(65).toString()).toBe("age lt 65")
    })

    it("generates le filter", () => {
      expect(path.le(65).toString()).toBe("age le 65")
    })

    it("generates ascending order", () => {
      expect(path.asc()).toBe("age asc")
    })

    it("generates descending order", () => {
      expect(path.desc()).toBe("age desc")
    })
  })

  describe("BooleanPath", () => {
    const path = new BooleanPath("active")

    it("generates eq true filter", () => {
      expect(path.eq(true).toString()).toBe("active eq true")
    })

    it("generates eq false filter", () => {
      expect(path.eq(false).toString()).toBe("active eq false")
    })

    it("generates isTrue filter", () => {
      expect(path.isTrue().toString()).toBe("active eq true")
    })

    it("generates isFalse filter", () => {
      expect(path.isFalse().toString()).toBe("active eq false")
    })
  })

  describe("DateTimePath", () => {
    const path = new DateTimePath("createdAt")
    const date = new Date("2024-06-15T10:30:00.000Z")

    it("generates eq filter", () => {
      const filter = path.eq(date).toString()
      expect(filter).toBe("createdAt eq datetime'2024-06-15T10:30:00.000'")
    })

    it("generates gt filter", () => {
      const filter = path.gt(date).toString()
      expect(filter).toBe("createdAt gt datetime'2024-06-15T10:30:00.000'")
    })

    it("generates year extraction", () => {
      const yearPath = path.year()
      expect(yearPath.eq(2024).toString()).toBe("year(createdAt) eq 2024")
    })

    it("generates month extraction", () => {
      const monthPath = path.month()
      expect(monthPath.eq(6).toString()).toBe("month(createdAt) eq 6")
    })

    it("generates day extraction", () => {
      const dayPath = path.day()
      expect(dayPath.eq(15).toString()).toBe("day(createdAt) eq 15")
    })
  })

  describe("CollectionPath", () => {
    interface Item {
      name: StringPath
      value: NumberPath
    }

    const itemPaths: Item = {
      name: new StringPath("name"),
      value: new NumberPath("value")
    }

    const collection = new CollectionPath<Item>("items", () => itemPaths)

    it("generates any filter", () => {
      const filter = collection.any((item) => item.value.gt(100))
      expect(filter.toString()).toBe("items/any(a:a/value gt 100)")
    })

    it("generates all filter", () => {
      const filter = collection.all((item) => item.name.startsWith("Test"))
      expect(filter.toString()).toBe("items/all(a:startswith(a/name,'Test'))")
    })
  })

  describe("QueryBuilder", () => {
    // Define a simple entity type for testing
    interface NestedValue {
      value: number
    }

    interface TestEntity {
      id: string
      name: string
      age: number
      active: boolean
      nested: NestedValue
    }

    interface QNestedValue {
      value: NumberPath
    }

    const qNestedValue: QNestedValue = {
      value: new NumberPath("value")
    }

    // Create query paths
    interface QTestEntity {
      id: StringPath
      name: StringPath
      age: NumberPath
      active: BooleanPath
      nested: EntityPath<QNestedValue>
    }

    const qTestEntity: QTestEntity = {
      id: new StringPath("id"),
      name: new StringPath("name"),
      age: new NumberPath("age"),
      active: new BooleanPath("active"),
      nested: new EntityPath<QNestedValue>("nested", () => qNestedValue)
    }

    it("builds filter query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .filter((q) => q.name.eq("John"))
        .build()

      expect(query.$filter).toBe("name eq 'John'")
    })

    it("builds multiple filters with AND", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .filter((q) => q.name.eq("John"))
        .filter((q) => q.age.gt(18))
        .build()

      expect(query.$filter).toBe("name eq 'John' and age gt 18")
    })

    it("builds complex filter with AND/OR", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .filter((q) =>
          q.age.gt(18).and(q.age.lt(65)).or(q.active.isFalse())
        )
        .build()

      expect(query.$filter).toBe(
        "((age gt 18) and (age lt 65)) or (active eq false)"
      )
    })

    it("builds select query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .select("id", "name", "age")
        .build()

      expect(query.$select).toBe("id,name,age")
    })

    it("builds expand query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .expand("nested")
        .build()

      expect(query.$expand).toBe("nested")
    })

    it("builds orderBy query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .orderBy((q) => q.age.desc())
        .build()

      expect(query.$orderby).toBe("age desc")
    })

    it("builds multiple orderBy", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .orderBy((q) => [q.name.asc(), q.age.desc()])
        .build()

      expect(query.$orderby).toBe("name asc,age desc")
    })

    it("builds top query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .top(10)
        .build()

      expect(query.$top).toBe(10)
    })

    it("builds skip query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .skip(20)
        .build()

      expect(query.$skip).toBe(20)
    })

    it("builds complete query", () => {
      const query = createQueryBuilder<TestEntity, QTestEntity>(qTestEntity)
        .filter((q) => q.name.startsWith("J"))
        .filter((q) => q.age.gt(0))
        .select("id", "name", "age")
        .expand("nested")
        .orderBy((q) => q.age.desc())
        .top(10)
        .skip(0)
        .build()

      expect(query.$filter).toBe("startswith(name,'J') and age gt 0")
      expect(query.$select).toBe("id,name,age")
      expect(query.$expand).toBe("nested")
      expect(query.$orderby).toBe("age desc")
      expect(query.$top).toBe(10)
      expect(query.$skip).toBe(0)
    })
  })
})

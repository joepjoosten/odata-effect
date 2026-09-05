import { expect, it } from "@effect/vitest"
import { createQueryBuilder, StringPath } from "../src/QueryBuilder.js"

it("preserves OR groups when filters are chained or supplied as an array", () => {
  const paths = { name: new StringPath("Name") }
  const a = paths.name.eq("A")
  const b = paths.name.eq("B")
  const c = paths.name.eq("C")
  const expected = "((Name eq 'A') or (Name eq 'B')) and (Name eq 'C')"
  expect(createQueryBuilder(paths).filter(a.or(b)).filter(c).build().$filter).toBe(expected)
  expect(createQueryBuilder(paths).filter([a.or(b), c]).build().$filter).toBe(expected)
  expect(createQueryBuilder(paths).filter(() => [a.or(b), c]).build().$filter).toBe(expected)
  expect(createQueryBuilder(paths).filter(a.or(b).not()).filter(c).build().$filter)
    .toBe("(not ((Name eq 'A') or (Name eq 'B'))) and (Name eq 'C')")
})

import { expect, it } from "@effect/vitest"
import { CollectionPath, EntityPath, StringPath } from "../src/QueryBuilder.js"

it("preserves nested navigation paths and keeps outer and inner lambda scopes distinct", () => {
  const customer = { name: new StringPath("DisplayName", { version: "V4" }) }
  const item = { name: new StringPath("ItemName"), customer: new EntityPath("Customer", () => customer) }
  const order = { name: new StringPath("OrderName"), items: new CollectionPath("LineItems", () => item) }
  const orders = new CollectionPath("Orders", () => order)
  const filter = orders.any((o) => o.items.all((i) => i.customer.getEntity().name.eq("A").and(o.name.eq("B"))))
  expect(filter.toString()).toBe(
    "Orders/any(a:a/LineItems/all(a1:(a1/Customer/DisplayName eq 'A') and (a/OrderName eq 'B')))"
  )
  // Reusing paths must not leak aliases into later queries or mutate generated singleton paths.
  expect(orders.any((o) => o.name.eq("C")).toString()).toBe("Orders/any(a:a/OrderName eq 'C')")
  expect(item.customer.getEntity().name.path).toBe("DisplayName")
  expect(order.items.path).toBe("LineItems")
})

it("keeps cyclic navigation lazy", () => {
  interface Node {
    name: StringPath
    children: CollectionPath<Node>
  }
  const node: Node = { name: new StringPath("Name"), children: new CollectionPath("Children", () => node) }
  expect(node.children.any((a) => a.children.any((b) => b.name.eq("X"))).toString())
    .toBe("Children/any(a:a/Children/any(a1:a1/Name eq 'X'))")
})

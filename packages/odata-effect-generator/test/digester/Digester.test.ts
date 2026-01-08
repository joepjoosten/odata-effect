import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as fs from "node:fs"
import * as path from "node:path"
import { digestMetadata } from "../../src/digester/Digester.js"
import { parseODataMetadata } from "../../src/parser/XmlParser.js"

const resourceDir = path.resolve(__dirname, "../resource")

describe("Digester", () => {
  describe("V2 metadata", () => {
    it("digests OData V2 metadata correctly", () =>
      Effect.gen(function*() {
        const xmlContent = fs.readFileSync(
          path.join(resourceDir, "odata-v2.xml"),
          "utf-8"
        )
        const edmx = yield* parseODataMetadata(xmlContent)
        const dataModel = yield* digestMetadata(edmx)

        expect(dataModel.version).toBe("V2")
        expect(dataModel.namespace).toBe("ODataDemo")
        expect(dataModel.serviceName).toBe("DemoService")

        // Entity types
        expect(dataModel.entityTypes.size).toBe(3)
        expect(dataModel.entityTypes.has("ODataDemo.Product")).toBe(true)
        expect(dataModel.entityTypes.has("ODataDemo.Category")).toBe(true)
        expect(dataModel.entityTypes.has("ODataDemo.Supplier")).toBe(true)

        // Product entity
        const product = dataModel.entityTypes.get("ODataDemo.Product")!
        expect(product.name).toBe("Product")
        expect(product.keys).toHaveLength(1)
        expect(product.keys[0].odataName).toBe("ID")
        expect(product.properties.length).toBeGreaterThan(0)
        expect(product.navigationProperties).toHaveLength(2)

        // Navigation properties
        const categoryNav = product.navigationProperties.find(
          (np) => np.odataName === "Category"
        )
        expect(categoryNav).toBeDefined()
        expect(categoryNav!.isCollection).toBe(false)
        expect(categoryNav!.targetType).toBe("Category")

        // Complex types
        expect(dataModel.complexTypes.size).toBe(1)
        expect(dataModel.complexTypes.has("ODataDemo.Address")).toBe(true)

        const address = dataModel.complexTypes.get("ODataDemo.Address")!
        expect(address.name).toBe("Address")
        expect(address.properties.length).toBe(5)

        // Entity sets
        expect(dataModel.entitySets.size).toBe(3)
        expect(dataModel.entitySets.has("Products")).toBe(true)
        expect(dataModel.entitySets.has("Categories")).toBe(true)
        expect(dataModel.entitySets.has("Suppliers")).toBe(true)

        // Function imports
        expect(dataModel.operations.size).toBe(1)
        const getProducts = dataModel.operations.get(
          "ODataDemo.GetProductsByRating"
        )
        expect(getProducts).toBeDefined()
        expect(getProducts!.type).toBe("Function")
        expect(getProducts!.isBound).toBe(false)
        expect(getProducts!.parameters).toHaveLength(1)
      }))
  })

  describe("V4 metadata", () => {
    it("digests OData V4 metadata correctly", () =>
      Effect.gen(function*() {
        const xmlContent = fs.readFileSync(
          path.join(resourceDir, "trippin.xml"),
          "utf-8"
        )
        const edmx = yield* parseODataMetadata(xmlContent)
        const dataModel = yield* digestMetadata(edmx)

        expect(dataModel.version).toBe("V4")
        expect(dataModel.namespace).toBe("Trippin")
        expect(dataModel.serviceName).toBe("Container")

        // Entity types
        expect(dataModel.entityTypes.size).toBeGreaterThan(0)
        expect(dataModel.entityTypes.has("Trippin.Person")).toBe(true)
        expect(dataModel.entityTypes.has("Trippin.Trip")).toBe(true)
        expect(dataModel.entityTypes.has("Trippin.Airline")).toBe(true)

        // Person entity
        const person = dataModel.entityTypes.get("Trippin.Person")!
        expect(person.name).toBe("Person")
        expect(person.keys).toHaveLength(1)
        expect(person.keys[0].odataName).toBe("UserName")

        // Navigation properties
        const friendsNav = person.navigationProperties.find(
          (np) => np.odataName === "Friends"
        )
        expect(friendsNav).toBeDefined()
        expect(friendsNav!.isCollection).toBe(true)
        expect(friendsNav!.targetType).toBe("Person")

        // Enum types
        expect(dataModel.enumTypes.size).toBe(2)
        expect(dataModel.enumTypes.has("Trippin.PersonGender")).toBe(true)
        expect(dataModel.enumTypes.has("Trippin.Feature")).toBe(true)

        const personGender = dataModel.enumTypes.get("Trippin.PersonGender")!
        expect(personGender.name).toBe("PersonGender")
        expect(personGender.members).toHaveLength(3)
        expect(personGender.members.map((m) => m.name)).toContain("Male")
        expect(personGender.members.map((m) => m.name)).toContain("Female")
        expect(personGender.members.map((m) => m.name)).toContain("Unknown")

        // Complex types
        expect(dataModel.complexTypes.size).toBeGreaterThan(0)
        expect(dataModel.complexTypes.has("Trippin.Location")).toBe(true)
        expect(dataModel.complexTypes.has("Trippin.City")).toBe(true)

        // Entity sets
        expect(dataModel.entitySets.has("People")).toBe(true)
        expect(dataModel.entitySets.has("Airlines")).toBe(true)
        expect(dataModel.entitySets.has("Airports")).toBe(true)

        // Singletons
        expect(dataModel.singletons.size).toBe(1)
        expect(dataModel.singletons.has("Me")).toBe(true)

        // Functions and Actions
        expect(dataModel.operations.size).toBeGreaterThan(0)

        // Unbound function
        const getNearestAirport = dataModel.operations.get(
          "Trippin.GetNearestAirport"
        )
        expect(getNearestAirport).toBeDefined()
        expect(getNearestAirport!.type).toBe("Function")
        expect(getNearestAirport!.isBound).toBe(false)
        expect(getNearestAirport!.parameters).toHaveLength(2)

        // Bound function
        const getFavoriteAirline = dataModel.operations.get(
          "Trippin.GetFavoriteAirline"
        )
        expect(getFavoriteAirline).toBeDefined()
        expect(getFavoriteAirline!.type).toBe("Function")
        expect(getFavoriteAirline!.isBound).toBe(true)

        // Action
        const resetDataSource = dataModel.operations.get(
          "Trippin.ResetDataSource"
        )
        expect(resetDataSource).toBeDefined()
        expect(resetDataSource!.type).toBe("Action")
      }))
  })
})

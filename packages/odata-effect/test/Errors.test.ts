import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  EntityNotFoundError,
  ODataError,
  ParseError,
  SapApplication,
  SapError,
  SapErrorBody,
  SapErrorDetail,
  SapErrorMessage,
  SapErrorResolution,
  SapErrorResponse
} from "../src/Errors.js"

describe("Errors", () => {
  describe("ODataError", () => {
    it("creates an ODataError with message", () => {
      const error = new ODataError({ message: "Request failed" })
      expect(error._tag).toBe("ODataError")
      expect(error.message).toBe("Request failed")
      expect(error.cause).toBeUndefined()
    })

    it("creates an ODataError with message and cause", () => {
      const cause = new Error("Network error")
      const error = new ODataError({ message: "Request failed", cause })
      expect(error._tag).toBe("ODataError")
      expect(error.message).toBe("Request failed")
      expect(error.cause).toBe(cause)
    })
  })

  describe("SapError", () => {
    it("creates a SapError with code and message", () => {
      const error = new SapError({ code: "BP/001", message: "Business partner not found" })
      expect(error._tag).toBe("SapError")
      expect(error.code).toBe("BP/001")
      expect(error.message).toBe("Business partner not found")
      expect(error.details).toBeUndefined()
      expect(error.innererror).toBeUndefined()
    })

    it("creates a SapError with details", () => {
      const details = [
        new SapErrorDetail({
          code: "BP/002",
          message: "Invalid field",
          propertyref: "Name",
          severity: "error",
          target: "/Name"
        })
      ]
      const error = new SapError({
        code: "BP/001",
        message: "Validation failed",
        details
      })
      expect(error.details).toHaveLength(1)
      expect(error.details![0].propertyref).toBe("Name")
    })
  })

  describe("EntityNotFoundError", () => {
    it("creates an EntityNotFoundError", () => {
      const error = new EntityNotFoundError({ entityType: "Product", id: "123" })
      expect(error._tag).toBe("EntityNotFoundError")
      expect(error.entityType).toBe("Product")
      expect(error.id).toBe("123")
    })
  })

  describe("ParseError", () => {
    it("creates a ParseError with message", () => {
      const error = new ParseError({ message: "Invalid JSON" })
      expect(error._tag).toBe("ParseError")
      expect(error.message).toBe("Invalid JSON")
      expect(error.cause).toBeUndefined()
    })

    it("creates a ParseError with cause", () => {
      const cause = new SyntaxError("Unexpected token")
      const error = new ParseError({ message: "Invalid JSON", cause })
      expect(error.cause).toBe(cause)
    })
  })

  describe("Schema Classes", () => {
    describe("SapErrorDetail", () => {
      it("decodes a valid error detail", () =>
        Effect.gen(function*() {
          const data = {
            code: "ERR001",
            message: "Field is required",
            propertyref: "Name",
            severity: "error",
            target: "/Name"
          }
          const result = yield* Schema.decodeUnknown(SapErrorDetail)(data)
          expect(result.code).toBe("ERR001")
          expect(result.message).toBe("Field is required")
          expect(result.propertyref).toBe("Name")
          expect(result.severity).toBe("error")
          expect(result.target).toBe("/Name")
        }).pipe(Effect.runPromise))
    })

    describe("SapErrorResolution", () => {
      it("decodes a valid error resolution", () =>
        Effect.gen(function*() {
          const data = {
            SAP_Transaction: "SM13",
            SAP_Note: "123456"
          }
          const result = yield* Schema.decodeUnknown(SapErrorResolution)(data)
          expect(result.SAP_Transaction).toBe("SM13")
          expect(result.SAP_Note).toBe("123456")
        }).pipe(Effect.runPromise))
    })

    describe("SapApplication", () => {
      it("decodes a valid application info", () =>
        Effect.gen(function*() {
          const data = {
            component_id: "BC-SRV-ODA",
            service_namespace: "/SAP/",
            service_id: "TEST_SRV",
            service_version: "0001"
          }
          const result = yield* Schema.decodeUnknown(SapApplication)(data)
          expect(result.component_id).toBe("BC-SRV-ODA")
          expect(result.service_namespace).toBe("/SAP/")
          expect(result.service_id).toBe("TEST_SRV")
          expect(result.service_version).toBe("0001")
        }).pipe(Effect.runPromise))
    })

    describe("SapErrorMessage", () => {
      it("decodes a valid error message", () =>
        Effect.gen(function*() {
          const data = {
            lang: "en",
            value: "An error occurred"
          }
          const result = yield* Schema.decodeUnknown(SapErrorMessage)(data)
          expect(result.lang).toBe("en")
          expect(result.value).toBe("An error occurred")
        }).pipe(Effect.runPromise))
    })

    describe("SapErrorBody", () => {
      it("decodes a valid error body without innererror", () =>
        Effect.gen(function*() {
          const data = {
            code: "ERR001",
            message: {
              lang: "en",
              value: "Something went wrong"
            }
          }
          const result = yield* Schema.decodeUnknown(SapErrorBody)(data)
          expect(result.code).toBe("ERR001")
          expect(result.message.lang).toBe("en")
          expect(result.message.value).toBe("Something went wrong")
          expect(result.innererror).toBeUndefined()
        }).pipe(Effect.runPromise))

      it("decodes a valid error body with innererror", () =>
        Effect.gen(function*() {
          const data = {
            code: "ERR001",
            message: {
              lang: "en",
              value: "Something went wrong"
            },
            innererror: {
              application: {
                component_id: "BC-SRV-ODA",
                service_namespace: "/SAP/",
                service_id: "TEST_SRV",
                service_version: "0001"
              },
              transactionid: "TX123",
              timestamp: "2024-01-01T00:00:00.000Z",
              Error_Resolution: {
                SAP_Transaction: "SM13",
                SAP_Note: "123456"
              },
              errordetails: [
                {
                  code: "ERR002",
                  message: "Field invalid",
                  propertyref: "Field1",
                  severity: "error",
                  target: "/Field1"
                }
              ]
            }
          }
          const result = yield* Schema.decodeUnknown(SapErrorBody)(data)
          expect(result.innererror).toBeDefined()
          expect(result.innererror!.transactionid).toBe("TX123")
          expect(result.innererror!.errordetails).toHaveLength(1)
        }).pipe(Effect.runPromise))
    })

    describe("SapErrorResponse", () => {
      it("decodes a complete SAP error response", () =>
        Effect.gen(function*() {
          const data = {
            error: {
              code: "ERR001",
              message: {
                lang: "en",
                value: "An error occurred"
              }
            }
          }
          const result = yield* Schema.decodeUnknown(SapErrorResponse)(data)
          expect(result.error.code).toBe("ERR001")
          expect(result.error.message.value).toBe("An error occurred")
        }).pipe(Effect.runPromise))
    })
  })
})

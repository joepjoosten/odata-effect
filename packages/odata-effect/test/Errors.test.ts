import { describe, expect, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import {
  SapApplication,
  SapErrorBody,
  SapErrorDetail,
  SapErrorMessage,
  SapErrorResolution,
  SapErrorResponse
} from "../src/Errors.js"

describe("Errors", () => {
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorDetail)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorResolution)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapApplication)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorMessage)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorBody)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorBody)(data)
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
          const result = yield* Schema.decodeUnknownEffect(SapErrorResponse)(data)
          expect(result.error.code).toBe("ERR001")
          expect(result.error.message.value).toBe("An error occurred")
        }).pipe(Effect.runPromise))
    })
  })
})

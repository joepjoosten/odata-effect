/**
 * Effect-wrapped XML parser for OData metadata.
 *
 * @since 1.0.0
 */
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { parseStringPromise } from "xml2js"
import type { ODataEdmxModel } from "./EdmxSchema.js"

/**
 * Error thrown when XML parsing fails.
 *
 * @since 1.0.0
 * @category errors
 */
export class XmlParseError extends Schema.TaggedError<XmlParseError>()(
  "XmlParseError",
  {
    message: Schema.String,
    cause: Schema.Unknown
  }
) {}

/**
 * Parse OData metadata XML content into a structured object.
 *
 * @since 1.0.0
 * @category parsing
 */
export const parseODataMetadata = (
  xmlContent: string
): Effect.Effect<ODataEdmxModel, XmlParseError> =>
  Effect.tryPromise({
    try: () =>
      parseStringPromise(xmlContent, {
        explicitArray: true,
        preserveChildrenOrder: true,
        attrkey: "$",
        charkey: "_"
      }) as Promise<ODataEdmxModel>,
    catch: (error) =>
      new XmlParseError({
        message: "Failed to parse OData metadata XML",
        cause: error
      })
  })

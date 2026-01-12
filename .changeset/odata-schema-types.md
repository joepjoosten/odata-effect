---
"@odata-effect/odata-effect": minor
"@odata-effect/odata-effect-generator": minor
---

Add OData-specific Effect Schema types for proper V2/V4 wire format handling

OData V2 and V4 use different wire formats that require special encoding/decoding:

**OData V2 Formats:**
- `Edm.DateTime` / `Edm.DateTimeOffset`: Uses `/Date(milliseconds)/` format in JSON
- `Edm.Time`: Uses ISO 8601 duration format (`PT12H30M15S`)
- `Edm.Byte`, `Edm.SByte`, `Edm.Single`, `Edm.Double`: Sent as strings in JSON
- `Edm.Int64`, `Edm.Decimal`: Kept as strings to preserve precision

**OData V4 Formats:**
- `Edm.DateTimeOffset`: Uses ISO 8601 format (`2022-12-31T23:59:59Z`)
- `Edm.Date`: Uses date-only format (`2022-12-31`)
- `Edm.TimeOfDay`: Uses time-only format (`12:30:15`)
- Numeric types: Sent as actual JSON numbers

**New ODataSchema Module:**

```typescript
import { ODataSchema } from "@odata-effect/odata-effect"

// V2 DateTime: "/Date(1672531199000)/" -> Date object
const dateField = ODataSchema.ODataV2DateTime

// V4 Date: "2022-12-31" -> Date object
const dateOnlyField = ODataSchema.ODataV4Date

// V2 Number: "123.45" -> number (for Byte, SByte, Single, Double)
const numericField = ODataSchema.ODataV2Number
```

**Generator Updates:**

The generator now uses these OData-specific schemas instead of generic Effect Schema types, ensuring proper encoding/decoding of OData responses. The `ODataSchema` import is automatically added to generated Models when needed.

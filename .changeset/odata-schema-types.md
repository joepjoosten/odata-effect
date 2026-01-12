---
"@odata-effect/odata-effect": minor
"@odata-effect/odata-effect-generator": minor
---

Add OData-specific Effect Schema types for proper V2/V4 wire format handling

OData V2 and V4 use different wire formats that require special encoding/decoding. This adds schemas that properly handle these formats using Effect's built-in types:

**Effect Types Used:**
- `DateTime.Utc` / `DateTime.Zoned` for date/time values
- `BigDecimal.BigDecimal` for Int64 and Decimal (preserves precision)
- `Duration.Duration` for time durations

**OData V2 Formats:**
- `Edm.DateTime`: `/Date(milliseconds)/` → `DateTime.Utc`
- `Edm.DateTimeOffset`: `/Date(milliseconds+offset)/` → `DateTime.Zoned`
- `Edm.Time`: ISO 8601 duration (`PT12H30M15S`) → `Duration.Duration`
- `Edm.Int64`, `Edm.Decimal`: Strings → `BigDecimal.BigDecimal`
- `Edm.Byte`, `Edm.SByte`, `Edm.Single`, `Edm.Double`: Strings → `number`

**OData V4 Formats:**
- `Edm.DateTimeOffset`: ISO 8601 (`2022-12-31T23:59:59Z`) → `DateTime.Zoned`
- `Edm.Date`: Date-only (`2022-12-31`) → `DateTime.Utc`
- `Edm.Duration`: ISO 8601 duration → `Duration.Duration`

**New ODataSchema Module:**

```typescript
import { ODataSchema } from "@odata-effect/odata-effect"
import * as Schema from "effect/Schema"

// V2 DateTime: "/Date(1672531199000)/" -> DateTime.Utc
const dateField = ODataSchema.ODataV2DateTime

// V4 Date: "2022-12-31" -> DateTime.Utc
const dateOnlyField = ODataSchema.ODataV4Date

// V2 Int64: "9007199254740993" -> BigDecimal.BigDecimal
const int64Field = ODataSchema.ODataV2Int64

// V2 Time: "PT12H30M15S" -> Duration.Duration
const timeField = ODataSchema.ODataV2Time
```

**Generator Updates:**

The generator now uses these OData-specific schemas and automatically adds required Effect type imports (DateTime, BigDecimal, Duration) to generated Models when needed.

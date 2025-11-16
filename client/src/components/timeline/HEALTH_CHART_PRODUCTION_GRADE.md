# Production-Grade Health Chart Component

This document explains the comprehensive features and fixes implemented in the production-grade health chart component to address all critical issues.

## Key Features Implemented

### 1. Universal Value Sanitizer

**Function:** `sanitizeMetricValue(value)`

Handles all problematic data types:

- `null`/`undefined` values → returns `0`
- String values like `"-"` or empty strings → returns `0`
- Text values like `"high"`, `"low"`, `"normal"` → assigns neutral numbers
- Valid numbers (strings or numbers) → converts to proper Number type
- Always returns a valid number

```typescript
const sanitizeMetricValue = (value: any): number => {
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  // Handle string representations of null/empty values
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed === "-" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined"
    ) {
      return 0;
    }

    // Handle text values like "high", "low", "normal", etc.
    const lowerValue = trimmed.toLowerCase();
    if (
      ["high", "low", "normal", "moderate", "elevated", "optimal"].includes(
        lowerValue
      )
    ) {
      // Assign neutral numbers based on relative value
      switch (lowerValue) {
        case "low":
          return -1;
        case "high":
          return 1;
        case "elevated":
          return 1;
        case "optimal":
          return 0;
        case "normal":
          return 0;
        case "moderate":
          return 0;
        default:
          return 0;
      }
    }

    // Try to parse numeric strings
    const num = parseFloat(trimmed.replace(/[^\d.-]/g, ""));
    return isNaN(num) ? 0 : num;
  }

  // Handle numeric values
  if (typeof value === "number") {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }

  // Default fallback
  return 0;
};
```

### 2. Safe Domain Calculation

**Function:** `calculateSafeDomain(values)`

Ensures domains never contain NaN:

- Filters out invalid values before calculation
- Handles identical values by adding padding
- Compresses very large values (>10,000) using log scaling
- Always returns a valid [min, max] tuple

```typescript
const calculateSafeDomain = (values: number[]): [number, number] => {
  // Filter out any invalid values
  const validValues = values.filter(
    (val) => typeof val === "number" && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    return [0, 1];
  }

  // Handle very large values (compression for values > 10,000)
  const compressedValues = validValues.map((val) => {
    if (Math.abs(val) > 10000) {
      // Apply log scaling for very large values
      return val > 0 ? Math.log10(val) : -Math.log10(Math.abs(val));
    }
    return val;
  });

  const minValue = Math.min(...compressedValues);
  const maxValue = Math.max(...compressedValues);

  // If all values are the same, create a small range around that value
  if (minValue === maxValue) {
    const value = minValue;
    // Add padding to prevent flat line
    const padding = Math.abs(value) * 0.1 || 1;
    return [value - padding, value + padding];
  }

  // Otherwise create a 10% buffer around min/max
  const range = (maxValue - minValue) * 0.1;
  return [minValue - range, maxValue + range];
};
```

### 3. Dynamic Metric Categorization

Automatically categorizes metrics based on keywords:

- No hardcoded filter list
- Generates categories dynamically from metric names
- Supports new metrics without code changes
- Category keywords include: heart, cardio, sugar, lipid/cholesterol, kidney, liver, orthopedic, bone, etc.

```typescript
const categorizeMetric = (metricKey: string): string => {
  const lowerKey = metricKey.toLowerCase();

  // Define category keywords
  const categories: Record<string, string[]> = {
    blood: ["bp", "pressure", "blood"],
    sugar: ["glucose", "sugar", "hba1c"],
    cholesterol: ["hdl", "ldl", "cholesterol", "lipid", "triglycerides"],
    ecg: [
      "ecg",
      "treadmill",
      "ef",
      "arrhythmias",
      "troponin",
      "heart",
      "qt",
      "st",
      "lvh",
    ],
    bone: ["bone", "density", "calcium"],
    kidney: ["gfr", "creatinine", "kidney", "urea"],
    liver: ["liver", "sgpt", "sgot", "alt", "ast", "bilirubin"],
    cardio: ["cardio", "heart", "hr", "bpm"],
    orthopedic: ["orthopedic", "joint", "knee", "hip", "spine"],
  };

  // Check each category
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerKey.includes(keyword))) {
      return category;
    }
  }

  // Default to other
  return "other";
};
```

### 4. Error Boundaries

Wraps all Recharts components with error boundaries:

- Prevents entire page crashes
- Gracefully handles rendering errors
- Provides fallback UI when charts fail

```typescript
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Chart error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chart unavailable</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Safe Tooltip Components

Implements comprehensive null checks:

- Validates payload existence
- Checks for valid values before rendering
- Prevents tooltip crashes on hover

```typescript
const CombinedChartTooltip = ({ active, payload, label }: any) => {
  // Safety checks
  if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg dark:bg-slate-800">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => {
        // Additional safety checks
        if (!entry || entry.value == null || isNaN(entry.value)) {
          return null;
        }

        return (
          <div key={index} className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">{entry.dataKey}</span>
            </div>
            <span className="font-medium text-foreground">
              {formatMetricValue(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
```

### 6. Responsive Grid Layout

Implements proper responsive design:

- Minimum width: 260px
- Height: 200px
- Automatic text wrapping for long metric names
- Responsive grid (1 column mobile, 2 tablet, 3-4 desktop)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Mini charts with min-w-[260px] min-h-[200px] */}
</div>
```

### 7. Safe Date Parsing

Handles invalid date formats:

- Validates dates before use
- Provides fallback for invalid dates
- Formats dates consistently for display

```typescript
const parseSafeDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return null;

  return parsedDate;
};
```

### 8. Multi-Axis Chart Scaling

The overall chart normalizes each metric:

- Each metric gets appropriate scaling
- Prevents mixed scale issues
- Handles large range differences (0.05 vs 52,000)

## Benefits

1. **Complete NaN Protection**: Multiple layers of protection against NaN values
2. **Dynamic Categorization**: Automatically handles new metrics without code changes
3. **Error Resilience**: Error boundaries prevent page crashes
4. **Data Integrity**: Sanitizes all input data before processing
5. **Responsive Design**: Adapts to different screen sizes
6. **Performance**: Optimized rendering with memoization
7. **Accessibility**: Clear visual indicators and proper fallbacks
8. **Maintainability**: Modular, well-documented code

## Usage

The production-grade component is a drop-in replacement for the original HealthChart component:

```tsx
import HealthChart from "@/components/timeline/health-chart-production";

<HealthChart
  data={timelineData}
  timeRange={timeRange}
  metricType={metricType}
  isLoading={isLoading}
/>;
```

## Testing

To test the production-grade health chart component:

1. Navigate to `/health-timeline-production-demo` in the application
2. The demo page will show the enhanced health chart with sample data
3. Verify all the features are working correctly:
   - Data sanitization
   - Safe domain calculation
   - Dynamic metric categorization
   - Error boundaries
   - Responsive layout
   - Safe tooltip rendering

This component provides a robust, production-ready solution for displaying health timeline data with comprehensive error handling and data validation.

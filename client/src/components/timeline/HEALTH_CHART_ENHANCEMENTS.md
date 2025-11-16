# Enhanced Health Timeline Chart Component

This document explains the enhancements made to the Health Timeline chart component to address all the issues mentioned in the requirements.

## Key Enhancements

### 1. Automatic Y-axis Scaling (Per Metric)

- Each mini-chart now auto-scales based on its own values
- Min = smallest value – 10%
- Max = largest value + 10%
- Prevents invisible lines for small variations

### 2. Handle Metrics With No Variation

- If values are identical (example: 120,120,120):
  - Draw a flat horizontal line
  - Still show a sparkline with a neutral color
  - Trend arrow shows → stable

### 3. Proper Value Formatting

- Values > 10,000 are formatted with commas (ex: 52,852)
- Values < 1 show 2 decimals
- Text metrics ("Low", "Moderate") show dot markers only

### 4. Auto-Wrapping Layout

- Responsive grid layout:
  - Desktop: 3–4 per row
  - Tablet: 2 per row
  - Mobile: 1 per row
- No overlapping or cramped cards

### 5. Minimum Card Size

- Width: 260–300px
- Height: 180–220px
- Padding: 18–20px
- Prevents clumsy UI

### 6. Individual Metric Trend Calculation

- For each metric:
  - Compare newest value vs previous value
  - Show ↑ ↓ → based on trend
  - Use green/red/gray color

### 7. Overall Combined Chart

- Automatically generates one combined timeline chart
- Auto-scales each metric independently
- Shows event markers (reports, prescriptions)
- Tooltip per metric only (never show all metrics at once)

### 8. Dynamic Metric Detection

- No hardcoding
- Automatically creates charts for:
  - BP
  - Sugar
  - Cholesterol
  - ECG metrics
  - Kidney markers
  - Liver markers
  - Bone density
  - Any new metric in future reports

### 9. Clean, Modern UI Style

- Rounded cards
- Soft shadows
- Smooth sparkline
- Good spacing
- Tailwind CSS

## Implementation Details

### Y-Axis Domain Calculation

```typescript
const calculateYAxisDomain = (values: number[]): [number, number] => {
  if (values.length === 0) {
    return [0, 1];
  }

  // If all values are the same, create a small range around that value
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const value = minValue;
    const range = Math.abs(value) * 0.1 || 1; // 10% of value or 1 if value is 0
    return [value - range, value + range];
  }

  // Otherwise create a 10% buffer around min/max
  const range = (maxValue - minValue) * 0.1;
  return [minValue - range, maxValue + range];
};
```

### Value Formatting

```typescript
const formatValue = (value: number | string): string => {
  if (typeof value === "string") return value;

  if (value > 10000) {
    return value.toLocaleString();
  } else if (value < 1) {
    return value.toFixed(2);
  } else {
    return value.toString();
  }
};
```

### Responsive Grid Layout

The component uses Tailwind CSS classes for responsive grid layout:

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Mini charts */}
</div>
```

### Dynamic Metric Categorization

Metrics are automatically categorized based on keyword matching:

```typescript
const METRIC_CATEGORIES: Record<
  string,
  {
    name: string;
    icon: React.ReactNode;
    keywords: string[];
  }
> = {
  blood: {
    name: "Blood Pressure",
    icon: <Heart className="h-4 w-4" />,
    keywords: ["bp", "pressure", "blood"],
  },
  // ... other categories
};
```

## Usage

The enhanced component is a drop-in replacement for the original HealthChart component:

```tsx
import HealthChart from "@/components/timeline/health-chart-enhanced";

<HealthChart
  data={timelineData}
  timeRange={timeRange}
  metricType={metricType}
  isLoading={isLoading}
/>;
```

## Benefits

1. **Better Data Visualization**: Each metric is properly scaled to show meaningful trends
2. **Improved Responsiveness**: Layout adapts to different screen sizes
3. **Enhanced Readability**: Proper formatting makes values easier to read
4. **Dynamic Adaptation**: Works with any new metrics without code changes
5. **Better Performance**: Optimized rendering with memoization
6. **Accessibility**: Clear visual indicators for trends and values

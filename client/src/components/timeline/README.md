# Health Timeline Components

This directory contains the enhanced Health Timeline chart components that address all the issues mentioned in the requirements.

## Components

### health-chart-enhanced.tsx

This is the main enhanced health chart component that includes all the improvements:

- Automatic Y-axis scaling per metric
- Handling of metrics with no variation
- Proper value formatting
- Auto-wrapping responsive layout
- Minimum card sizing
- Individual metric trend calculation
- Overall combined chart
- Dynamic metric detection
- Clean, modern UI

### health-chart-enhanced.test.tsx

Unit tests for the enhanced health chart component.

### HEALTH_CHART_ENHANCEMENTS.md

Detailed documentation of all the enhancements made to the health chart component.

## Usage

To use the enhanced health chart component in your application:

```tsx
import HealthChart from "@/components/timeline/health-chart-enhanced";

<HealthChart
  data={timelineData}
  timeRange={timeRange}
  metricType={metricType}
  isLoading={isLoading}
/>;
```

## Testing

To test the enhanced health chart component:

1. Navigate to `/health-timeline-demo` in the application
2. The demo page will show the enhanced health chart with sample data
3. You can verify all the enhancements are working correctly:
   - Auto-scaling charts
   - Proper value formatting
   - Responsive layout
   - Trend calculations
   - Dynamic metric detection

## Features

### Automatic Y-axis Scaling

Each mini-chart auto-scales based on its own values:

- Min = smallest value – 10%
- Max = largest value + 10%

### Handle Metrics With No Variation

If values are identical (example: 120,120,120):

- Draw a flat horizontal line
- Still show a sparkline with a neutral color
- Trend arrow shows → stable

### Proper Value Formatting

- Values > 10,000 are formatted with commas (ex: 52,852)
- Values < 1 show 2 decimals
- Text metrics ("Low", "Moderate") show dot markers only

### Auto-Wrapping Layout

Responsive grid layout:

- Desktop: 3–4 per row
- Tablet: 2 per row
- Mobile: 1 per row

### Minimum Card Size

- Width: 260–300px
- Height: 180–220px
- Padding: 18–20px

### Individual Metric Trend Calculation

For each metric:

- Compare newest value vs previous value
- Show ↑ ↓ → based on trend
- Use green/red/gray color

### Dynamic Metric Detection

Automatically creates charts for any new metrics without hardcoding.

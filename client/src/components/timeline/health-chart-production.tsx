import React from "react";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Activity,
  Heart,
  Droplets,
  Zap,
  Bone,
  Waves,
  Leaf,
} from "lucide-react";
import { TimelineEvent } from "@/types/medical";

// Error Boundary Component
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

// Universal value sanitizer
const sanitizeMetricValue = (value: unknown): number => {
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

// Safe date parser
const parseSafeDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return null;

  return parsedDate;
};

// Safe domain calculation
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

// Dynamic metric categorization
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

// Get category icon
const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category) {
    case "blood":
      return <Heart className="h-4 w-4" />;
    case "sugar":
      return <Droplets className="h-4 w-4" />;
    case "cholesterol":
      return <Droplets className="h-4 w-4" />;
    case "ecg":
      return <Zap className="h-4 w-4" />;
    case "bone":
      return <Bone className="h-4 w-4" />;
    case "kidney":
      return <Waves className="h-4 w-4" />;
    case "liver":
      return <Leaf className="h-4 w-4" />;
    case "cardio":
      return <Heart className="h-4 w-4" />;
    case "orthopedic":
      return <Bone className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

// Get category name
const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    blood: "Blood Pressure",
    sugar: "Sugar Levels",
    cholesterol: "Cholesterol",
    ecg: "Heart / ECG",
    bone: "Bone Health",
    kidney: "Kidney Function",
    liver: "Liver Function",
    cardio: "Cardiovascular",
    orthopedic: "Orthopedic",
    other: "Other Metrics",
  };

  return (
    names[category] || category.charAt(0).toUpperCase() + category.slice(1)
  );
};

// Format value for display
const formatMetricValue = (value: number): string => {
  if (value > 10000) {
    return value.toLocaleString();
  } else if (Math.abs(value) < 1) {
    return value.toFixed(2);
  } else {
    return value.toString();
  }
};

// Custom tooltip component for the combined chart with safety checks
const CombinedChartTooltip = ({ active, payload, label }: { active?: boolean, payload?: { color: string, dataKey: string, value: string | number }[], label?: string }) => {
  // Safety checks
  if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-lg dark:bg-slate-800">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: { color: string, dataKey: string, value: string | number }, index: number) => {
        // Additional safety checks
        if (!entry || entry.value == null || (typeof entry.value === 'number' && isNaN(entry.value))) {
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
              {typeof entry.value === 'number' ? formatMetricValue(entry.value) : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Custom tooltip for mini charts with safety checks
const MiniChartTooltip = ({ active, payload, label }: { active?: boolean, payload?: { dataKey: string, value: string | number }[], label?: string }) => {
  // Safety checks
  if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const entry = payload[0];
  if (!entry || entry.value == null || (typeof entry.value === 'number' && isNaN(entry.value))) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg dark:bg-slate-800">
      <p className="font-medium text-foreground text-sm">{label}</p>
      <p className="text-xs text-foreground mt-1">
        {`${entry.dataKey}: ${typeof entry.value === 'number' ? formatMetricValue(entry.value) : entry.value}`}
      </p>
    </div>
  );
};

// Mini Chart Component for each metric
const MiniChart = ({
  metricKey,
  metricData,
  color,
}: {
  metricKey: string;
  metricData: { date: string; value: number; eventType?: string }[];
  color: string;
}) => {
  // Get latest value
  const latestDataPoint = metricData[metricData.length - 1];
  const latestValue = latestDataPoint?.value;

  // Get previous value for comparison
  const previousDataPoint =
    metricData.length > 1 ? metricData[metricData.length - 2] : null;
  const previousValue = previousDataPoint?.value;

  // Calculate trend
  let trend: "up" | "down" | "stable" = "stable";
  if (typeof latestValue === "number" && typeof previousValue === "number") {
    const diff = latestValue - previousValue;
    trend = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
  }

  // Get trend icon and color
  const getTrendInfo = () => {
    switch (trend) {
      case "up":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: "text-red-500", // Worsening
        };
      case "down":
        return {
          icon: <TrendingDown className="h-4 w-4" />,
          color: "text-green-500", // Improving
        };
      default:
        return {
          icon: <Minus className="h-4 w-4" />,
          color: "text-gray-500", // Stable
        };
    }
  };

  const trendInfo = getTrendInfo();

  // Calculate Y-axis domain for auto-scaling
  const yAxisDomain = useMemo(() => {
    const values = metricData.map((d) => d.value);
    return calculateSafeDomain(values);
  }, [metricData]);

  // Format display name
  const formatMetricName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Find min and max values
  const values = metricData.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  return (
    <Card className="rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 min-w-[260px] h-[200px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground truncate">
            {formatMetricName(metricKey)}
          </CardTitle>
          <div className={`flex items-center gap-1 ${trendInfo.color}`}>
            {trendInfo.icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-foreground truncate">
            {formatMetricValue(latestValue)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-4rem)]">
        <div className="h-32 w-full flex-grow">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metricData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis dataKey="date" hide={true} />
                <YAxis domain={yAxisDomain} hide={true} />
                <Tooltip content={<MiniChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: color,
                    strokeWidth: 2,
                    stroke: "#ffffff",
                  }}
                  activeDot={{
                    r: 5,
                    fill: color,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex justify-between">
          <span>Min: {formatMetricValue(minValue)}</span>
          <span>Max: {formatMetricValue(maxValue)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Dynamic Health Timeline Component
interface ChartPoint {
  date: string;
  eventType: string;
  [key: string]: string | number | null;
}

interface MetricData {
  data: { date: string; value: number; eventType?: string }[];
  category: string;
}

interface CategorizedMetrics {
  [category: string]: {
    [metricKey: string]: MetricData;
  };
}

export default function HealthChart({
  data,
  isLoading,
}: {
  data: TimelineEvent[];
  isLoading: boolean;
}) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Process data to extract metrics and categories
  const { chartData, categorizedMetrics, allCategories, allMetrics } =
    useMemo(() => {
      if (!data || data.length === 0) {
        return {
          chartData: [],
          categorizedMetrics: {},
          allCategories: [],
          allMetrics: [],
        };
      }

      // Transform data for the combined chart
      const chartData: ChartPoint[] = [];

      // Extract all unique metrics
      const metricMap: { [metricKey: string]: MetricData } = {};

      data.forEach((event) => {
        // Safely check if event and event.metrics exist
        if (!event || !event.metrics) return;

        // Parse and validate date
        const parsedDate = parseSafeDate(event.date);
        if (!parsedDate) return;

        // Format date for display
        const displayDate = parsedDate.toISOString().split("T")[0];

        // Determine event type
        let eventType = "report";
        if (event.prescriptions && event.prescriptions.length > 0) {
          eventType = "prescription";
        } else if (event.eventType) {
          eventType = event.eventType;
        }

        const chartPoint: ChartPoint = {
          date: displayDate,
          eventType: eventType,
        };

        Object.entries(event.metrics).forEach(([metricKey, metricValue]) => {
          // Skip if metric is null/undefined
          if (!metricKey || metricValue === null || metricValue === undefined)
            return;

          // Sanitize the value
          const sanitizedValue = sanitizeMetricValue(metricValue);

          // Skip if value is invalid
          if (isNaN(sanitizedValue) || !isFinite(sanitizedValue)) {
            return;
          }

          // Add to chart data
          chartPoint[metricKey] = sanitizedValue;

          // Initialize metric data array if not exists
          if (!metricMap[metricKey]) {
            // Determine category based on metric name
            const category = categorizeMetric(metricKey);

            metricMap[metricKey] = {
              data: [],
              category,
            };
          }

          // Add data point
          metricMap[metricKey].data.push({
            date: displayDate,
            value: sanitizedValue,
            eventType: eventType,
          });
        });

        chartData.push(chartPoint);
      });

      // Group metrics by category
      const categorizedMetrics: CategorizedMetrics = {};

      // Dynamically create categories based on detected metrics
      Object.entries(metricMap).forEach(([metricKey, metricInfo]) => {
        const category = metricInfo.category;
        if (!categorizedMetrics[category]) {
          categorizedMetrics[category] = {};
        }
        categorizedMetrics[category][metricKey] = metricInfo;
      });

      // Get all categories with metrics
      const allCategories = Object.entries(categorizedMetrics)
        .filter(([, metrics]) => Object.keys(metrics).length > 0)
        .map(([category]) => category);

      // Get all metrics
      const allMetrics = Object.keys(metricMap);

      return { chartData, categorizedMetrics, allCategories, allMetrics };
    }, [data]);

  // Toggle filter
  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Get filtered metrics for the combined chart
  const filteredMetrics = useMemo(() => {
    if (activeFilters.length === 0) return allMetrics;

    const filteredMetricSet = new Set<string>();
    activeFilters.forEach((category) => {
      const metrics = categorizedMetrics[category];
      if (metrics) {
        Object.keys(metrics).forEach((metric) => filteredMetricSet.add(metric));
      }
    });

    return Array.from(filteredMetricSet);
  }, [activeFilters, categorizedMetrics, allMetrics]);

  // Get filtered chart data
  const filteredChartData = useMemo(() => {
    if (filteredMetrics.length === 0) return chartData;

    return chartData.map((point) => {
      const filteredPoint: ChartPoint = {
        date: point.date,
        eventType: point.eventType,
      };
      filteredMetrics.forEach((metric) => {
        const value = point[metric];
        // Ensure value is valid
        if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
          filteredPoint[metric] = value;
        } else {
          filteredPoint[metric] = 0; // Default to 0 for invalid values
        }
      });
      return filteredPoint;
    });
  }, [chartData, filteredMetrics]);

  // Get filtered categories for mini charts
  const filteredCategories = useMemo(() => {
    if (activeFilters.length === 0) return allCategories;
    return allCategories.filter((category) => activeFilters.includes(category));
  }, [activeFilters, allCategories]);

  // Colors for metrics
  const metricColors = useMemo(() => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#f97316",
      "#6366f1",
      "#ec4899",
      "#8b5cf6",
    ];

    const colorMap: Record<string, string> = {};
    let colorIndex = 0;

    allMetrics.forEach((metricKey) => {
      colorMap[metricKey] = colors[colorIndex % colors.length];
      colorIndex++;
    });

    return colorMap;
  }, [allMetrics]);

  // Get event icon based on event type
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "prescription":
        return "💊";
      case "consultation":
        return "🩺";
      default:
        return "📄";
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
          <CardTitle className="text-xl font-bold">Health Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-80 bg-gray-200 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 rounded-xl min-w-[260px]"
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
          <CardTitle className="text-xl font-bold">Health Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Health Data Available
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload medical reports to see your health timeline and trends
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
        <CardTitle className="text-xl font-bold">Health Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Dynamic Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4 py-2 text-sm font-medium"
            onClick={() => setActiveFilters([])}
          >
            <Filter className="h-4 w-4 mr-2" />
            All Metrics
          </Button>

          {allCategories.map((category) => (
            <Button
              key={category}
              variant={activeFilters.includes(category) ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
              onClick={() => toggleFilter(category)}
            >
              {getCategoryIcon(category)}
              {getCategoryName(category)}
            </Button>
          ))}
        </div>

        {/* Combined Chart */}
        <div className="h-96 mb-8 rounded-xl border border-border p-4 overflow-hidden">
          <ChartErrorBoundary>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CombinedChartTooltip />} />
                <Legend />

                {/* Render lines for filtered metrics */}
                {filteredMetrics.map((metric) => {
                  const values = filteredChartData
                    .map((d) => d[metric])
                    .filter(
                      (val) =>
                        typeof val === "number" && !isNaN(val) && isFinite(val)
                    );

                  if (values.length === 0) return null;

                  return (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={metricColors[metric]}
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: metricColors[metric],
                        strokeWidth: 2,
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 6,
                        fill: metricColors[metric],
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      name={metric
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    />
                  );
                })}

                {/* Event markers */}
                {filteredChartData.map((point, index) => {
                  // Find the first numeric value that is not NaN
                  const numericValue = Object.values(point).find(
                    (val) =>
                      typeof val === "number" && !isNaN(val) && isFinite(val)
                  );
                  const yValue =
                    numericValue !== undefined &&
                    typeof numericValue === "number" &&
                    !isNaN(numericValue) &&
                    isFinite(numericValue)
                      ? numericValue
                      : 0;

                  return (
                    <ReferenceDot
                      key={`marker-${index}`}
                      x={point.date}
                      y={yValue}
                      r={6}
                      fill="#ffffff"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      shape={(props: { cx: number, cy: number }) => (
                        <g transform={`translate(${props.cx},${props.cy})`}>
                          <circle
                            cx="0"
                            cy="0"
                            r="6"
                            fill="#ffffff"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          <text
                            x="0"
                            y="1"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="10"
                            fill="#3b82f6"
                            fontWeight="bold"
                          >
                            {getEventIcon(point.eventType)}
                          </text>
                        </g>
                      )}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartErrorBoundary>
        </div>

        {/* Categorized Metrics Grid */}
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const metrics = categorizedMetrics[category];
            const metricKeys = Object.keys(metrics);

            if (metricKeys.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {getCategoryName(category)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                  {metricKeys.map((metricKey) => (
                    <MiniChart
                      key={metricKey}
                      metricKey={metricKey}
                      metricData={metrics[metricKey].data}
                      color={metricColors[metricKey]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

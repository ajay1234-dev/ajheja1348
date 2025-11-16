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
  FileText,
  Pill,
  Stethoscope,
} from "lucide-react";
import { TimelineEvent } from "@/types/medical";

// Utility functions
const isNumeric = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value);
};

const parseNumericValue = (value: any): number | null => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value.replace(/[^\\d.-]/g, ""));
    return isNaN(num) ? null : num;
  }
  return null;
};

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

// Calculate Y-axis domain with 10% padding
const calculateYAxisDomain = (values: number[]): [number, number] => {
  // Filter out any NaN or invalid values
  const validValues = values.filter((val) => !isNaN(val) && isFinite(val));

  if (validValues.length === 0) {
    return [0, 1];
  }

  // If all values are the same, create a small range around that value
  const minValue = Math.min(...validValues);
  const maxValue = Math.max(...validValues);

  if (minValue === maxValue) {
    const value = minValue;
    const range = Math.abs(value) * 0.1 || 1; // 10% of value or 1 if value is 0
    return [value - range, value + range];
  }

  // Otherwise create a 10% buffer around min/max
  const range = (maxValue - minValue) * 0.1;
  return [minValue - range, maxValue + range];
};

// Metric category definitions
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
  sugar: {
    name: "Sugar",
    icon: <Droplets className="h-4 w-4" />,
    keywords: ["glucose", "sugar", "hba1c"],
  },
  cholesterol: {
    name: "Cholesterol",
    icon: <Droplets className="h-4 w-4" />,
    keywords: ["hdl", "ldl", "cholesterol", "lipid"],
  },
  ecg: {
    name: "Heart / ECG",
    icon: <Zap className="h-4 w-4" />,
    keywords: [
      "ecg",
      "treadmill",
      "ef",
      "arrhythmias",
      "troponin",
      "heart",
      "qt",
      "st",
    ],
  },
  bone: {
    name: "Bone",
    icon: <Bone className="h-4 w-4" />,
    keywords: ["bone", "density"],
  },
  kidney: {
    name: "Kidney",
    icon: <Waves className="h-4 w-4" />,
    keywords: ["gfr", "creatinine", "kidney"],
  },
  liver: {
    name: "Liver",
    icon: <Leaf className="h-4 w-4" />,
    keywords: ["liver", "sgpt", "sgot", "bilirubin"],
  },
  other: {
    name: "Other Metrics",
    icon: <Activity className="h-4 w-4" />,
    keywords: [],
  },
};

// Custom tooltip component for the combined chart
const CombinedChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg dark:bg-slate-800">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-foreground">{entry.dataKey}</span>
            </div>
            <span className="font-medium text-foreground">
              {isNumeric(entry.value) ? formatValue(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for mini charts
const MiniChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg dark:bg-slate-800">
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-foreground mt-1">
          {`${payload[0].dataKey}: ${
            isNumeric(payload[0].value)
              ? formatValue(payload[0].value)
              : payload[0].value
          }`}
        </p>
      </div>
    );
  }
  return null;
};

// Mini Chart Component for each metric
const MiniChart = ({
  metricKey,
  metricData,
  color,
}: {
  metricKey: string;
  metricData: { date: string; value: number | string; eventType?: string }[];
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
  if (isNumeric(latestValue) && isNumeric(previousValue)) {
    const diff = (latestValue as number) - (previousValue as number);
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
    const numericValues = metricData
      .map((d) => d.value)
      .filter(isNumeric)
      .filter((val) => !isNaN(val as number));

    return calculateYAxisDomain(numericValues);
  }, [metricData]);

  // Format display name
  const formatMetricName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 min-w-[260px] min-h-[180px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            {formatMetricName(metricKey)}
          </CardTitle>
          <div className={`flex items-center gap-1 ${trendInfo.color}`}>
            {trendInfo.icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-foreground">
            {isNumeric(latestValue) ? formatValue(latestValue) : latestValue}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metricData.filter((d) => {
                // Filter out data points with NaN values
                if (isNumeric(d.value)) {
                  return !isNaN(d.value as number);
                }
                return true; // Keep non-numeric values (text)
              })}
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
                  r: isNumeric(latestValue) ? 3 : 4,
                  fill: color,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
                activeDot={{
                  r: isNumeric(latestValue) ? 5 : 6,
                  fill: color,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-xs text-muted-foreground flex justify-between">
          <span>
            {previousDataPoint && (
              <span>
                Prev:{" "}
                {isNumeric(previousValue)
                  ? formatValue(previousValue)
                  : previousValue}{" "}
                → Now:{" "}
                {isNumeric(latestValue)
                  ? formatValue(latestValue)
                  : latestValue}
                {isNumeric(latestValue) && isNumeric(previousValue) && (
                  <span className={trendInfo.color}>
                    {" "}
                    ({trend === "up" ? "+" : ""}
                    {(
                      (latestValue as number) - (previousValue as number)
                    ).toFixed(1)}
                    )
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Dynamic Health Timeline Component
export default function HealthChart({
  data,
  timeRange,
  metricType,
  isLoading,
}: {
  data: TimelineEvent[];
  timeRange: string;
  metricType: string;
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
      const chartData: Record<string, any>[] = [];

      // Extract all unique metrics
      const metricMap: Record<
        string,
        {
          data: { date: string; value: number | string; eventType?: string }[];
          category: string;
        }
      > = {};

      data.forEach((event) => {
        // Safely check if event and event.metrics exist
        if (!event || !event.metrics) return;

        // Determine event type
        let eventType = "report";
        if (event.prescriptions && event.prescriptions.length > 0) {
          eventType = "prescription";
        } else if (event.eventType) {
          eventType = event.eventType;
        }

        const chartPoint: Record<string, any> = {
          date: event.date,
          eventType: eventType,
        };

        Object.entries(event.metrics).forEach(([metricKey, metricValue]) => {
          // Skip if metric is null/undefined
          if (!metricKey || metricValue === null || metricValue === undefined)
            return;

          // Add to chart data
          const numericValue = parseNumericValue(metricValue);
          chartPoint[metricKey] =
            numericValue !== null ? numericValue : metricValue;

          // Initialize metric data array if not exists
          if (!metricMap[metricKey]) {
            // Determine category based on keywords
            let category = "other";
            const lowerMetric = metricKey.toLowerCase();

            for (const [cat, catInfo] of Object.entries(METRIC_CATEGORIES)) {
              if (cat === "other") continue;

              if (
                catInfo.keywords.some((keyword) =>
                  lowerMetric.includes(keyword)
                )
              ) {
                category = cat;
                break;
              }
            }

            metricMap[metricKey] = {
              data: [],
              category,
            };
          }

          // Filter out NaN values
          const finalValue = numericValue !== null ? numericValue : metricValue;
          if (isNumeric(finalValue) && isNaN(finalValue as number)) {
            // Skip NaN values
            return;
          }

          // Add data point
          metricMap[metricKey].data.push({
            date: event.date,
            value: finalValue,
            eventType: eventType,
          });
        });

        chartData.push(chartPoint);
      });

      // Group metrics by category
      const categorizedMetrics: Record<string, typeof metricMap> = {};
      Object.entries(METRIC_CATEGORIES).forEach(([category]) => {
        categorizedMetrics[category] = {};
      });

      Object.entries(metricMap).forEach(([metricKey, metricInfo]) => {
        const category = metricInfo.category;
        if (!categorizedMetrics[category]) {
          categorizedMetrics[category] = {};
        }
        categorizedMetrics[category][metricKey] = metricInfo;
      });

      // Get all categories with metrics
      const allCategories = Object.entries(categorizedMetrics)
        .filter(([category, metrics]) => Object.keys(metrics).length > 0)
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
      const filteredPoint: Record<string, any> = {
        date: point.date,
        eventType: point.eventType,
      };
      filteredMetrics.forEach((metric) => {
        const value = point[metric];
        // Filter out NaN values
        if (isNumeric(value) && isNaN(value as number)) {
          filteredPoint[metric] = null;
        } else {
          filteredPoint[metric] = value;
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
              {METRIC_CATEGORIES[category]?.icon}
              {METRIC_CATEGORIES[category]?.name || category}
            </Button>
          ))}
        </div>

        {/* Combined Chart */}
        <div className="h-80 mb-8 rounded-xl border border-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredChartData.map((point) => {
                // Filter out NaN values from the data point
                const filteredPoint: Record<string, any> = {};
                Object.entries(point).forEach(([key, value]) => {
                  if (key === "date" || key === "eventType") {
                    filteredPoint[key] = value;
                  } else if (isNumeric(value)) {
                    filteredPoint[key] = isNaN(value as number) ? null : value;
                  } else {
                    filteredPoint[key] = value;
                  }
                });
                return filteredPoint;
              })}
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
                const numericValues = filteredChartData
                  .map((d) => d[metric])
                  .filter(isNumeric)
                  .filter((val) => !isNaN(val as number));

                if (numericValues.length === 0) return null;

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
                  (val) => isNumeric(val) && !isNaN(val as number)
                );
                const yValue =
                  numericValue !== undefined && !isNaN(numericValue as number)
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
                    shape={(props) => (
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
                  {METRIC_CATEGORIES[category]?.icon}
                  {METRIC_CATEGORIES[category]?.name || category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

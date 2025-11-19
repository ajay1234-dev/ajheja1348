import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Universal value sanitizer
const sanitizeMetricValue = (value: string | number | null | undefined): number => {
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

// Format date for display
const formatDisplayDate = (dateString: string): string => {
  const date = parseSafeDate(dateString);
  if (!date) return "Invalid Date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  // Format display name
  const formatMetricName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Find min and max values
  const values = metricData.map((d) => d.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  // Prepare chart data for Chart.js
  const chartData = {
    labels: metricData.map((d) => formatDisplayDate(d.date)),
    datasets: [
      {
        label: metricKey,
        data: metricData.map((d) => d.value),
        borderColor: color,
        backgroundColor: `${color}20`, // Add transparency
        fill: true,
        tension: 0.4, // Smooth lines
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const label = context.dataset.label || ''; // Handle undefined label
            return `${label}: ${formatMetricValue(
              context.parsed.y ?? 0 // Handle null case
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        min: minValue,
        max: maxValue,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2.5,
        tension: 0.4,
      },
      point: {
        radius: 0,
        hoverRadius: 5,
        hitRadius: 5,
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <Card className="rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 min-w-[260px] h-[220px] flex flex-col">
      <CardHeader className="pb-3">
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
      <CardContent className="flex flex-col flex-grow pb-3">
        <div className="h-36 w-full flex-grow">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
          <span className="truncate">Min: {formatMetricValue(minValue)}</span>
          <span className="truncate">Max: {formatMetricValue(maxValue)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Dynamic Health Timeline Component
interface ChartPoint {
  date: string;
  eventType: string;
  [key: string]: string | number;
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
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);

  // Process data to extract metrics and categories
  const { chartData, categorizedMetrics, allCategories, allMetrics } =
    React.useMemo(() => {
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
  const filteredMetrics = React.useMemo(() => {
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
  const filteredChartData = React.useMemo(() => {
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
  const filteredCategories = React.useMemo(() => {
    if (activeFilters.length === 0) return allCategories;
    return allCategories.filter((category) => activeFilters.includes(category));
  }, [activeFilters, allCategories]);

  // Colors for metrics
  const metricColors = React.useMemo(() => {
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

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
          <CardTitle className="text-xl font-bold">Health Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
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

  // Prepare combined chart data for Chart.js
  const combinedChartData = {
    labels: filteredChartData.map((point: ChartPoint) => point.date),
    datasets: filteredMetrics.map((metric) => {
      const color = metricColors[metric] || "#3b82f6";
      return {
        label: metric
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        data: filteredChartData.map((point: ChartPoint) => point[metric] || 0),
        borderColor: color,
        backgroundColor: `${color}20`, // Add transparency
        fill: false,
        tension: 0.4, // Smooth lines
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }),
  };

  // Combined chart options
  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            const label = context.dataset.label || ''; // Handle undefined label
            return `${label}: ${formatMetricValue(
              context.parsed.y ?? 0 // Handle null case
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value: number | string) {
            if (typeof value === 'number') {
              return formatMetricValue(value);
            }
            return value;
          },
        },
      },
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.4,
      },
      point: {
        radius: 0,
        hoverRadius: 6,
        hitRadius: 6,
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
  };

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
        <div className="h-96 mb-8 rounded-xl border border-border p-4">
          <Line data={combinedChartData} options={combinedChartOptions} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                  {metricKeys.map((metricKey) => (
                    <div key={metricKey} className="flex">
                      <MiniChart
                        metricKey={metricKey}
                        metricData={metrics[metricKey].data}
                        color={metricColors[metricKey]}
                      />
                    </div>
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

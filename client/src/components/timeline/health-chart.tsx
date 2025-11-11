import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";
import React from "react";

interface HealthChartProps {
  data: any[];
  timeRange: string;
  metricType: string;
  isLoading: boolean;
}

// Custom tooltip component to show detailed information
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the full data point for this tooltip
    const dataPoint = payload[0]?.payload;

    return (
      <div className="bg-card border border-border rounded-md p-3 shadow-lg dark:bg-slate-800">
        <p className="font-semibold text-foreground">{`Date: ${label}`}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {dataPoint?.title || "Health Data"}
        </p>
        <p className="text-sm text-muted-foreground">
          {dataPoint?.eventType
            ? `Type: ${dataPoint.eventType
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}`
            : "Event"}
        </p>
        <div className="mt-2">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default function HealthChart({
  data,
  timeRange,
  metricType,
  isLoading,
}: HealthChartProps) {
  // Helper function to convert various date formats to Date object
  const parseEventDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();

    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // If it's a Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    // If it's a Firestore Timestamp object (with seconds and nanoseconds)
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      return new Date(dateValue.seconds * 1000);
    }

    // If it's a number (Unix timestamp)
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    // If it's a string (ISO format)
    if (typeof dateValue === "string") {
      return parseISO(dateValue);
    }

    // Fallback
    return new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Process data for chart
  const processChartData = () => {
    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [];

    if (!dataArray || dataArray.length === 0) {
      console.log("HealthChart: No data to process");
      return [];
    }

    console.log(
      "HealthChart: Processing data, raw data length:",
      dataArray.length
    );
    console.log("HealthChart: Metric type filter:", metricType);
    console.log("HealthChart: Raw data sample:", dataArray.slice(0, 2));

    // Filter and transform data based on metric type
    const filteredData = dataArray.filter((event) => {
      // Handle null/undefined events
      if (!event) return false;

      // Log event for debugging
      console.log("HealthChart: Checking event:", {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        hasMetrics: !!event.metrics,
        hasAnalysis: !!event.analysis,
        hasMedications: !!event.medications,
        hasExtractedData: !!event.extractedData,
      });

      // Include all events that have any data that could be charted
      if (metricType === "all") {
        // For "all" metric type, include events with any of these:
        // 1. Direct metrics
        // 2. Analysis with key findings
        // 3. Medications with dosage info that might be trackable
        // 4. Extracted data from reports
        // 5. Any event with a title and date (fallback)
        const hasMetrics =
          event.metrics && Object.keys(event.metrics).length > 0;
        const hasKeyFindings =
          event.analysis &&
          event.analysis.keyFindings &&
          Array.isArray(event.analysis.keyFindings) &&
          event.analysis.keyFindings.length > 0;
        const hasMedications =
          event.medications &&
          Array.isArray(event.medications) &&
          event.medications.length > 0;
        const hasExtractedData =
          event.extractedData &&
          typeof event.extractedData === "object" &&
          Object.keys(event.extractedData).length > 0;
        const hasBasicInfo = event.title && event.date;

        console.log("HealthChart: Event evaluation:", {
          hasMetrics,
          hasKeyFindings,
          hasMedications,
          hasExtractedData,
          hasBasicInfo,
          included:
            hasMetrics ||
            hasKeyFindings ||
            hasMedications ||
            hasExtractedData ||
            hasBasicInfo,
        });

        // Even include events with just basic info as fallback
        return (
          hasMetrics ||
          hasKeyFindings ||
          hasMedications ||
          hasExtractedData ||
          hasBasicInfo
        );
      }

      // For specific metric types, check if that metric exists
      const hasSpecificMetric = event.metrics && event.metrics[metricType];
      console.log("HealthChart: Specific metric check:", {
        metricType,
        hasSpecificMetric,
      });
      return hasSpecificMetric;
    });

    console.log("HealthChart: Filtered data length:", filteredData.length);
    console.log("HealthChart: Filtered data sample:", filteredData.slice(0, 2));

    // Transform to chart format
    const transformedData = filteredData
      .map((event) => {
        // Handle null/undefined events
        if (!event) return null;

        const parsedDate = parseEventDate(event.date);
        const chartPoint: any = {
          date: format(parsedDate, "MMM dd"),
          fullDate: parsedDate,
          eventType: event.eventType || "unknown",
          title: event.title || "Untitled Event",
        };

        // Extract metrics from different sources
        if (event.metrics) {
          // Extract relevant metrics
          if (event.metrics.blood_pressure) {
            const bp = event.metrics.blood_pressure;
            chartPoint.systolic =
              typeof bp === "string" ? parseInt(bp.split("/")[0]) : bp.systolic;
            chartPoint.diastolic =
              typeof bp === "string"
                ? parseInt(bp.split("/")[1])
                : bp.diastolic;
          }

          if (event.metrics.blood_sugar) {
            const value = event.metrics.blood_sugar;
            chartPoint.bloodSugar =
              typeof value === "string"
                ? parseInt(value)
                : typeof value === "number"
                ? value
                : null;
          }

          if (event.metrics.cholesterol) {
            const value = event.metrics.cholesterol;
            chartPoint.cholesterol =
              typeof value === "string"
                ? parseInt(value)
                : typeof value === "number"
                ? value
                : null;
          }

          if (event.metrics.weight) {
            const value = event.metrics.weight;
            chartPoint.weight =
              typeof value === "string"
                ? parseFloat(value)
                : typeof value === "number"
                ? value
                : null;
          }

          if (event.metrics.heart_rate) {
            const value = event.metrics.heart_rate;
            chartPoint.heartRate =
              typeof value === "string"
                ? parseInt(value)
                : typeof value === "number"
                ? value
                : null;
          }

          if (event.metrics.temperature) {
            const value = event.metrics.temperature;
            chartPoint.temperature =
              typeof value === "string"
                ? parseFloat(value)
                : typeof value === "number"
                ? value
                : null;
          }

          // Handle other metrics
          Object.keys(event.metrics).forEach((key) => {
            if (
              ![
                "blood_pressure",
                "blood_sugar",
                "cholesterol",
                "weight",
                "heart_rate",
                "temperature",
              ].includes(key)
            ) {
              const value = event.metrics[key];
              const numericValue =
                typeof value === "string"
                  ? parseFloat(value)
                  : typeof value === "number"
                  ? value
                  : null;
              if (numericValue !== null && !isNaN(numericValue)) {
                chartPoint[key] = numericValue;
              }
            }
          });
        }

        // Extract metrics from analysis key findings
        if (
          event.analysis &&
          event.analysis.keyFindings &&
          Array.isArray(event.analysis.keyFindings)
        ) {
          event.analysis.keyFindings.forEach((finding: any) => {
            if (finding.parameter && finding.value) {
              const paramName = finding.parameter
                .toLowerCase()
                .replace(/\s+/g, "_");
              // Try to parse numeric values
              const numericValue = parseFloat(finding.value);
              if (!isNaN(numericValue)) {
                chartPoint[paramName] = numericValue;
              } else {
                // Store non-numeric values as strings
                chartPoint[`${paramName}_text`] = finding.value;
              }
            }
          });
        }

        // Extract medication count as a metric
        if (event.medications && Array.isArray(event.medications)) {
          chartPoint.medicationCount = event.medications.length;
        }

        // Extract metrics from extractedData
        if (event.extractedData && typeof event.extractedData === "object") {
          Object.keys(event.extractedData).forEach((key) => {
            const value = event.extractedData[key];
            // Try to convert to numeric if possible
            if (typeof value === "string") {
              const numericValue = parseFloat(value);
              if (!isNaN(numericValue)) {
                chartPoint[key] = numericValue;
              } else {
                // Store non-numeric values as strings
                chartPoint[`${key}_text`] = value;
              }
            } else if (typeof value === "number") {
              chartPoint[key] = value;
            }
          });
        }

        // Fallback: if no metrics extracted but we have the event, show it with a basic count
        const chartPointKeys = Object.keys(chartPoint);
        console.log("Chart point keys:", chartPointKeys);
        console.log("Chart point keys length:", chartPointKeys.length);

        if (chartPointKeys.length <= 4) {
          // Only date, fullDate, eventType, title
          chartPoint.eventCount = 1; // Simple count metric
          console.log("Added fallback eventCount metric");
        }

        console.log("HealthChart: Transformed chart point:", chartPoint);
        return chartPoint;
      })
      .filter((point) => point !== null) // Remove null entries
      .sort((a, b) => {
        const dateA =
          a.fullDate instanceof Date ? a.fullDate : new Date(a.fullDate);
        const dateB =
          b.fullDate instanceof Date ? b.fullDate : new Date(b.fullDate);
        return dateA.getTime() - dateB.getTime();
      });

    console.log("HealthChart: Final transformed data:", transformedData);
    return transformedData;
  };

  const chartData = processChartData();
  console.log("Final chartData:", chartData);
  console.log("ChartData sample:", chartData.slice(0, 2));

  // Calculate trends
  const calculateTrend = (metricKey: string) => {
    const values = chartData
      .map((d) => d[metricKey])
      .filter((v) => v !== undefined && typeof v === "number");
    if (values.length < 2) return "stable";

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 5) return "up";
    if (change < -5) return "down";
    return "stable";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-700" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-700" />;
      default:
        return <Minus className="h-4 w-4 text-gray-700" />;
    }
  };

  const getMetricLines = () => {
    const lines: JSX.Element[] = [];
    const availableMetrics: string[] = [];

    // Collect all available metrics from the data
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (
          key !== "date" &&
          key !== "fullDate" &&
          key !== "eventType" &&
          key !== "title" &&
          !key.endsWith("_text") &&
          typeof d[key] === "number" &&
          !availableMetrics.includes(key)
        ) {
          availableMetrics.push(key);
        }
      });
    });

    console.log("Available metrics for chart lines:", availableMetrics);

    // Create lines for all available metrics
    availableMetrics.forEach((metric, index) => {
      // Use different colors for different metrics - black in light mode, yellow in dark mode
      lines.push(
        <Line
          key={metric}
          type="monotone"
          dataKey={metric}
          stroke="hsl(var(--chart-line))"
          strokeWidth={2}
          name={metric
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
          dot={{ r: 4, fill: "hsl(var(--chart-line))" }}
          activeDot={{ r: 6, fill: "hsl(var(--chart-line))" }}
        />
      );
    });

    console.log("Chart lines created:", lines.length);
    return lines;
  };

  // Get all unique metrics for trend indicators
  const getAllMetrics = () => {
    const metrics: string[] = [];
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        console.log("Checking metric key:", {
          key,
          value: d[key],
          type: typeof d[key],
        });
        if (
          key !== "date" &&
          key !== "fullDate" &&
          key !== "eventType" &&
          key !== "title" &&
          !key.endsWith("_text") &&
          typeof d[key] === "number" &&
          !metrics.includes(key)
        ) {
          metrics.push(key);
        }
      });
    });
    console.log("All metrics found:", metrics);
    return metrics;
  };

  const allMetrics = getAllMetrics();

  // Check if we have events but no chartable metrics
  const hasEventsButNoMetrics =
    Array.isArray(data) && data.length > 0 && chartData.length === 0;

  // Also check if we have chart data but no metrics to display
  const hasChartDataButNoMetrics =
    chartData.length > 0 && allMetrics.length === 0;

  console.log("HealthChart state:", {
    dataLength: Array.isArray(data) ? data.length : 0,
    chartDataLength: chartData.length,
    allMetricsLength: allMetrics.length,
    hasEventsButNoMetrics,
    hasChartDataButNoMetrics,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Health Trends</CardTitle>

          {/* Trend Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            {allMetrics.slice(0, 4).map((metric) => (
              <div key={metric} className="flex items-center space-x-1">
                {getTrendIcon(calculateTrend(metric))}
                <span className="font-medium">
                  {metric
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasEventsButNoMetrics
                  ? "No chartable health metrics found in your timeline"
                  : "No health data available for the selected time range"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {hasEventsButNoMetrics
                  ? "Upload reports with numerical health data (blood tests, lab results) to see trends"
                  : "Upload more reports to see your health trends"}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--chart-grid))"
                  className="opacity-30"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--chart-axis))"
                  fontSize={12}
                  className="dark:stroke-yellow-400"
                />
                <YAxis stroke="hsl(var(--chart-axis))" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {getMetricLines()}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

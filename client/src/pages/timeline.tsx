import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HealthChart from "@/components/timeline/health-chart";
import TimelineEvents from "@/components/timeline/timeline-events";
import { Calendar, TrendingUp } from "lucide-react";

export default function Timeline() {
  const [timeRange, setTimeRange] = useState("3m");
  const [metricType, setMetricType] = useState("all");

  const { data: timeline, isLoading } = useQuery({
    queryKey: ["/api/timeline"],
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
  });

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

    // If it's a number (Unix timestamp)
    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    // If it's a string (ISO format)
    if (typeof dateValue === "string") {
      return new Date(dateValue);
    }

    // Fallback
    return new Date();
  };

  // Filter data based on time range
  const getFilteredData = () => {
    if (!timeline || !Array.isArray(timeline)) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return timeline;
    }

    return timeline.filter(
      (event: any) => parseEventDate(event.date) >= cutoffDate
    );
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Health Timeline
          </h1>
          <p className="text-muted-foreground">
            Track your health progress and visualize trends over time
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-48" data-testid="metric-filter">
              <SelectValue placeholder="Metric Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
              <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
              <SelectItem value="cholesterol">Cholesterol</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48" data-testid="time-range-filter">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {filteredData.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Calendar className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Lab Results
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "lab_result"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Medication Changes
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "medication_change"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Appointments
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "appointment"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Calendar className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Trends Chart */}
      <HealthChart
        data={filteredData}
        timeRange={timeRange}
        metricType={metricType}
        isLoading={isLoading}
      />

      {/* Timeline Events */}
      <TimelineEvents events={filteredData} isLoading={isLoading} />
    </div>
  );
}

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
import HealthChart from "@/components/timeline/health-chart-chartjs";
import TimelineEvents from "@/components/timeline/timeline-events";
import { Calendar, TrendingUp } from "lucide-react";

export default function Timeline() {
  const [timeRange, setTimeRange] = useState("3m");
  const [metricType, setMetricType] = useState("all");

  const {
    data: timeline,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/timeline"],
    queryFn: async () => {
      const response = await fetch("/api/timeline", {
        credentials: "include",
      });

      console.log(
        "Timeline API response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }
        // For other errors, still return empty array to prevent UI crashes
        console.error(
          `Failed to fetch timeline: ${response.status} ${response.statusText}`
        );
        return [];
      }

      const data = await response.json();
      console.log(
        "Timeline data received:",
        Array.isArray(data) ? data.length : "Not an array"
      );
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
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
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
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

    console.log("Time range filter:", { timeRange, now, cutoffDate });

    const filtered = timeline.filter((event: any) => {
      const eventDate = parseEventDate(event.date);
      const included = eventDate >= cutoffDate;
      console.log("Event date check:", {
        eventId: event.id,
        eventTitle: event.title,
        eventDate,
        cutoffDate,
        included,
      });
      return included;
    });

    return filtered;
  };

  const filteredData = getFilteredData();

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Health Timeline
          </h1>
          <p className="text-muted-foreground">
            Track your health progress and visualize trends over time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger className="w-full" data-testid="metric-filter">
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
          </div>

          <div className="w-full sm:w-48">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full" data-testid="time-range-filter">
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Events
                </p>
                <p className="text-2xl font-bold mt-1">{filteredData.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Lab Results
                </p>
                <p className="text-2xl font-bold mt-1">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "lab_result"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Medication Changes
                </p>
                <p className="text-2xl font-bold mt-1">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "medication_change"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-slate-800 dark:to-slate-800 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Appointments
                </p>
                <p className="text-2xl font-bold mt-1">
                  {
                    filteredData.filter(
                      (e: any) => e.eventType === "appointment"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
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

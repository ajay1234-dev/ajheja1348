import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import HealthChart from "@/components/timeline/health-chart";
import TimelineEvents from "@/components/timeline/timeline-events";
import { Calendar, TrendingUp, ArrowLeft, User } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";

export default function PatientTimeline() {
  const [, params] = useRoute("/doctor/patient/:patientId/timeline");
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState("3m");
  const [metricType, setMetricType] = useState("all");

  const patientId = params?.patientId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/doctor/patient/${patientId}/timeline`],
    enabled: !!patientId,
    queryFn: async () => {
      const response = await fetch(
        `/api/doctor/patient/${patientId}/timeline`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        }
        if (response.status === 404) {
          throw new Error("Patient not found");
        }
        throw new Error(
          `Failed to fetch patient timeline: ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const parseEventDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    if (typeof dateValue === "number") {
      return new Date(dateValue);
    }

    if (typeof dateValue === "string") {
      return new Date(dateValue);
    }

    return new Date();
  };

  const getFilteredData = () => {
    if (!data?.timeline || !Array.isArray(data.timeline)) return [];

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
        return data.timeline;
    }

    return data.timeline.filter(
      (event: any) => parseEventDate(event.date) >= cutoffDate
    );
  };

  const filteredData = getFilteredData();

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <Button onClick={handleRetry}>Retry</Button>
          <Button
            onClick={() => navigate("/doctor-dashboard")}
            className="ml-4"
            data-testid="back-to-dashboard"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button
            onClick={() => navigate("/doctor-dashboard")}
            className="mt-4"
            data-testid="back-to-dashboard"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor-dashboard")}
            className="mb-2"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {data.patient.firstName} {data.patient.lastName}'s Health Timeline
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of patient's health history and trends
          </p>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="patient-email">
                {data.patient.email}
              </p>
            </div>
            {data.patient.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium" data-testid="patient-phone">
                  {data.patient.phone}
                </p>
              </div>
            )}
            {data.patient.dateOfBirth && (
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium" data-testid="patient-dob">
                  {safeFormatDate(data.patient.dateOfBirth, "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Time Range
                </label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger data-testid="time-range-select">
                    <SelectValue />
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
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Metric Type
                </label>
                <Select value={metricType} onValueChange={setMetricType}>
                  <SelectTrigger data-testid="metric-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    <SelectItem value="blood_pressure">
                      Blood Pressure
                    </SelectItem>
                    <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                    <SelectItem value="cholesterol">Cholesterol</SelectItem>
                    <SelectItem value="heart_rate">Heart Rate</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Chart */}
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

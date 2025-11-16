import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Pill,
  Calendar,
  Activity,
  Stethoscope,
  FileX,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { safeFormatDate, formatRelativeTime } from "@/lib/date-utils";

interface TimelineEventsProps {
  events: any[];
  isLoading: boolean;
}

export default function TimelineEvents({
  events,
  isLoading,
}: TimelineEventsProps) {
  // Ensure events is always an array and filter out null/undefined events
  const safeEvents = Array.isArray(events)
    ? events.filter((event) => event != null)
    : [];

  const parseEventDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue && typeof dateValue.toDate === "function")
      return dateValue.toDate();
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      return new Date(dateValue.seconds * 1000);
    }
    if (typeof dateValue === "number") return new Date(dateValue);
    if (typeof dateValue === "string") {
      try {
        return parseISO(dateValue);
      } catch {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      }
    }
    return new Date();
  };

  const getEventIcon = (eventType: string, reportType?: string) => {
    if (
      eventType === "scan" ||
      reportType === "x-ray" ||
      reportType === "mri" ||
      reportType === "ct_scan"
    ) {
      return <FileX className="h-5 w-5 text-orange-500" />;
    }
    if (eventType === "prescription" || eventType === "medication_change") {
      return <Pill className="h-5 w-5 text-green-500" />;
    }
    if (eventType === "consultation" || eventType === "appointment") {
      return <Stethoscope className="h-5 w-5 text-purple-500" />;
    }
    if (eventType === "lab_result" || reportType === "blood_test") {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (eventType === "health_metric") {
      return <TrendingUp className="h-5 w-5 text-teal-500" />;
    }
    return <Activity className="h-5 w-5 text-gray-500" />;
  };

  const getEventColor = (eventType: string, riskLevel?: string) => {
    if (riskLevel === "high")
      return "bg-red-500/20 text-red-800 border-red-500/30";
    if (riskLevel === "medium")
      return "bg-orange-500/20 text-orange-800 border-orange-500/30";

    switch (eventType) {
      case "scan":
        return "bg-orange-500/20 text-orange-800 border-orange-500/30";
      case "prescription":
      case "medication_change":
        return "bg-green-500/20 text-green-800 border-green-500/30";
      case "consultation":
      case "appointment":
        return "bg-purple-500/20 text-purple-800 border-purple-500/30";
      case "lab_result":
      case "uploaded_report":
        return "bg-blue-500/20 text-blue-800 border-blue-500/30";
      case "health_metric":
        return "bg-teal-500/20 text-teal-800 border-teal-500/30";
      default:
        return "bg-gray-500/20 text-gray-800 border-gray-500/30";
    }
  };

  const getEventTypeDisplay = (eventType: string, reportType?: string) => {
    if (reportType === "x-ray") return "X-Ray";
    if (reportType === "mri") return "MRI Scan";
    if (reportType === "ct_scan") return "CT Scan";
    if (reportType === "blood_test") return "Blood Test";
    if (reportType === "prescription") return "Prescription";

    const typeMap: { [key: string]: string } = {
      uploaded_report: "Medical Report",
      scan: "Scan/Imaging",
      prescription: "Prescription",
      medication_change: "Medication",
      consultation: "Doctor Consultation",
      appointment: "Appointment",
      lab_result: "Lab Result",
      health_metric: "Health Metrics",
    };

    return (
      typeMap[eventType] || eventType?.replace(/_/g, " ") || "Unknown Event"
    );
  };

  const getRiskLevelBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;

    const colors = {
      low: "bg-green-500/20 text-green-800 border-green-500/30",
      medium: "bg-orange-500/20 text-orange-800 border-orange-500/30",
      high: "bg-red-500/20 text-red-800 border-red-500/30",
    };

    const icons = {
      low: <CheckCircle className="h-3 w-3" />,
      medium: <AlertTriangle className="h-3 w-3" />,
      high: <AlertTriangle className="h-3 w-3" />,
    };

    return (
      <Badge className={colors[riskLevel as keyof typeof colors] || colors.low}>
        <span className="flex items-center gap-1">
          {icons[riskLevel as keyof typeof icons]}
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </Badge>
    );
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;

    const colors = {
      Low: "bg-green-500/20 text-green-800 border-green-500/30",
      Moderate: "bg-orange-500/20 text-orange-800 border-orange-500/30",
      High: "bg-red-500/20 text-red-800 border-red-500/30",
      Critical: "bg-red-600/20 text-red-800 border-red-600/30",
    };

    return (
      <Badge
        className={
          colors[severity as keyof typeof colors] ||
          "bg-gray-500/20 text-gray-800 border-gray-500/30"
        }
      >
        {severity}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Health Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="w-3 h-3 rounded-full mt-2" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border border-border rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Activity className="h-5 w-5" />
          Health Timeline
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {safeEvents && safeEvents.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events in timeline
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your health events will appear here as you upload reports,
              prescriptions, and medical records
            </p>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {safeEvents
              .filter((event) => event !== null && event !== undefined) // Filter out null/undefined events
              .map((event, index) => {
                // Additional safety check for required properties
                if (!event || typeof event !== "object") {
                  return null;
                }

                // Ensure event has required properties with defaults
                const safeEvent = {
                  id: event.id || `event-${index}`,
                  title: event.title || "Untitled Event",
                  eventType: event.eventType || "unknown",
                  date: event.date || new Date(),
                  ...event,
                };

                return (
                  <div
                    key={safeEvent.id}
                    className="flex items-start space-x-4"
                    data-testid={`timeline-event-${index}`}
                  >
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                        {getEventIcon(
                          safeEvent.eventType,
                          safeEvent.reportType
                        )}
                      </div>
                      {index < safeEvents.length - 1 && (
                        <div
                          className="w-px h-full bg-border mt-2"
                          style={{ minHeight: "60px" }}
                        />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pb-8">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg text-foreground">
                              {safeEvent.title}
                            </h4>
                            <Badge
                              className={getEventColor(
                                safeEvent.eventType,
                                safeEvent.riskLevel
                              )}
                            >
                              {getEventTypeDisplay(
                                safeEvent.eventType,
                                safeEvent.reportType
                              )}
                            </Badge>
                            {safeEvent.riskLevel &&
                              getRiskLevelBadge(safeEvent.riskLevel)}
                            {safeEvent.severityLevel &&
                              getSeverityBadge(safeEvent.severityLevel)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(
                              parseEventDate(safeEvent.date),
                              "MMMM d, yyyy • h:mm a"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Summary */}
                      {safeEvent.summary && (
                        <div className="mb-5">
                          <p className="text-base text-foreground leading-relaxed">
                            {typeof safeEvent.summary === "string"
                              ? safeEvent.summary
                              : JSON.stringify(safeEvent.summary)}
                          </p>
                        </div>
                      )}

                      {/* Upload Info - Date and Type */}
                      {(safeEvent.eventType === "uploaded_report" ||
                        safeEvent.reportType) && (
                        <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 mb-5 border border-slate-200 dark:border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-muted-foreground text-sm font-medium">
                                Upload Date:
                              </span>
                              <p className="font-semibold text-foreground mt-1">
                                {format(parseEventDate(safeEvent.date), "PPP")}{" "}
                                at {format(parseEventDate(safeEvent.date), "p")}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({formatRelativeTime(safeEvent.date)})
                                </span>
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-sm font-medium">
                                Report Type:
                              </span>
                              <p className="font-semibold text-foreground mt-1">
                                {getEventTypeDisplay(
                                  safeEvent.eventType,
                                  safeEvent.reportType
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Analysis Section - for Lab Results and Scans */}
                      {safeEvent.analysis &&
                        safeEvent.analysis.keyFindings &&
                        Array.isArray(safeEvent.analysis.keyFindings) && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 mb-5 border border-blue-200 dark:border-blue-800">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <h5 className="font-semibold text-base text-foreground flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                🔬 AI Analysis Results
                              </h5>
                              {safeEvent.severityLevel && (
                                <Badge
                                  className={
                                    safeEvent.severityLevel === "Critical"
                                      ? "bg-red-600 text-white"
                                      : safeEvent.severityLevel === "High"
                                      ? "bg-red-100 text-red-800"
                                      : safeEvent.severityLevel === "Moderate"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }
                                >
                                  Severity: {safeEvent.severityLevel}
                                </Badge>
                              )}
                            </div>

                            {/* Scan-specific header */}
                            {(safeEvent.reportType === "x-ray" ||
                              safeEvent.reportType === "mri" ||
                              safeEvent.reportType === "ct_scan" ||
                              safeEvent.eventType === "scan") && (
                              <div className="mb-4 pb-4 border-b border-blue-200 dark:border-blue-800">
                                <span className="text-muted-foreground text-sm font-medium">
                                  Diagnostic Result:
                                </span>
                                <p className="font-medium text-foreground mt-1 text-base">
                                  {safeEvent.analysis.diagnosis ||
                                    safeEvent.analysis.summary ||
                                    "AI analysis completed"}
                                </p>
                              </div>
                            )}

                            <div className="space-y-3">
                              {safeEvent.analysis.keyFindings.map(
                                (finding: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-blue-400/30 dark:border-blue-400/20 rounded-lg"
                                  >
                                    <div className="flex-1 mb-2 sm:mb-0">
                                      <span className="font-medium text-base">
                                        {typeof finding.parameter === "string"
                                          ? finding.parameter
                                          : "Finding " + (idx + 1)}
                                      </span>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {typeof finding.explanation === "string"
                                          ? finding.explanation
                                          : ""}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-lg">
                                        {typeof finding.value === "string" ||
                                        typeof finding.value === "number"
                                          ? finding.value
                                          : ""}
                                      </span>
                                      {finding.normalRange && (
                                        <p className="text-sm text-muted-foreground">
                                          {typeof finding.normalRange ===
                                          "string"
                                            ? finding.normalRange
                                            : ""}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Comparison to previous scans */}
                            {safeEvent.comparisonData && (
                              <div className="mt-5 pt-5 border-t border-blue-200 dark:border-blue-800">
                                <h6 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  COMPARISON TO PREVIOUS SCAN
                                </h6>
                                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-blue-400/30 dark:border-blue-400/20 rounded-lg p-4">
                                  {typeof safeEvent.comparisonData ===
                                  "string" ? (
                                    <p className="text-foreground">
                                      {safeEvent.comparisonData}
                                    </p>
                                  ) : safeEvent.comparisonData.trend ? (
                                    <>
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="font-medium">
                                          Trend:
                                        </span>
                                        <Badge
                                          className={
                                            safeEvent.comparisonData.trend ===
                                            "improving"
                                              ? "bg-green-100 text-green-800"
                                              : safeEvent.comparisonData
                                                  .trend === "stable"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-red-100 text-red-800"
                                          }
                                        >
                                          {safeEvent.comparisonData.trend}
                                        </Badge>
                                      </div>
                                      {safeEvent.comparisonData.notes && (
                                        <p className="text-muted-foreground">
                                          {safeEvent.comparisonData.notes}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">
                                      No previous scan available for comparison
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {safeEvent.analysis.recommendations &&
                              Array.isArray(
                                safeEvent.analysis.recommendations
                              ) &&
                              safeEvent.analysis.recommendations.length > 0 && (
                                <div className="mt-5 pt-5 border-t border-blue-200 dark:border-blue-800">
                                  <h6 className="font-semibold text-sm text-muted-foreground mb-3">
                                    💡 RECOMMENDATIONS
                                  </h6>
                                  <ul className="space-y-2">
                                    {safeEvent.analysis.recommendations.map(
                                      (rec: any, idx: number) => (
                                        <li
                                          key={idx}
                                          className="text-base text-foreground flex items-start gap-2"
                                        >
                                          <span className="text-blue-600 mt-1">
                                            •
                                          </span>
                                          <span>
                                            {typeof rec === "string"
                                              ? rec
                                              : JSON.stringify(rec)}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        )}

                      {/* Medications Section - for Prescriptions */}
                      {safeEvent.medications &&
                        Array.isArray(safeEvent.medications) &&
                        safeEvent.medications.length > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 mb-5 border border-green-200 dark:border-green-800">
                            <h5 className="font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                              <Pill className="h-5 w-5 text-green-600" />
                              💊 Prescribed Medications
                            </h5>

                            {/* Doctor & Prescription Info */}
                            {(safeEvent.doctorInfo?.name || safeEvent.date) && (
                              <div className="mb-4 pb-4 border-b border-green-200 dark:border-green-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {safeEvent.doctorInfo?.name && (
                                    <div>
                                      <span className="text-muted-foreground text-sm font-medium">
                                        Prescribed by:
                                      </span>
                                      <p className="font-medium text-foreground mt-1">
                                        {safeEvent.doctorInfo.name}
                                      </p>
                                      {safeEvent.doctorInfo.specialization && (
                                        <p className="text-muted-foreground text-sm">
                                          {safeEvent.doctorInfo.specialization}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground text-sm font-medium">
                                      Date Prescribed:
                                    </span>
                                    <p className="font-medium text-foreground mt-1">
                                      {format(
                                        parseEventDate(safeEvent.date),
                                        "MMM d, yyyy"
                                      )}
                                      <span className="text-xs text-muted-foreground ml-2">
                                        ({formatRelativeTime(safeEvent.date)})
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-4">
                              {safeEvent.medications.map(
                                (med: any, idx: number) => {
                                  // Calculate status based on dates
                                  const getStatus = () => {
                                    if (med.status) return med.status;
                                    if (med.endDate) {
                                      const endDate = parseEventDate(
                                        med.endDate
                                      );
                                      if (endDate < new Date())
                                        return "completed";
                                    }
                                    if (med.isActive === false)
                                      return "expired";
                                    return "active";
                                  };

                                  const status = getStatus();
                                  const statusColors = {
                                    active:
                                      "bg-green-100 text-green-800 border-green-300",
                                    completed:
                                      "bg-blue-100 text-blue-800 border-blue-300",
                                    expired:
                                      "bg-gray-100 text-gray-800 border-gray-300",
                                  };

                                  return (
                                    <div
                                      key={idx}
                                      className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-green-400/30 dark:border-green-400/20 rounded-lg p-4"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                        <h6 className="font-semibold text-base text-foreground">
                                          {typeof med.name === "string"
                                            ? med.name
                                            : "Medication"}
                                        </h6>
                                        <div className="flex flex-wrap gap-2">
                                          <Badge
                                            className={
                                              statusColors[
                                                status as keyof typeof statusColors
                                              ]
                                            }
                                            variant="outline"
                                          >
                                            {status.charAt(0).toUpperCase() +
                                              status.slice(1)}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-sm"
                                          >
                                            {med.frequency || "As directed"}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div>
                                          <span className="text-muted-foreground text-sm">
                                            Dosage:
                                          </span>
                                          <span className="ml-2 font-medium text-base">
                                            {typeof med.dosage === "string"
                                              ? med.dosage
                                              : "See prescription"}
                                          </span>
                                        </div>
                                        {med.duration && (
                                          <div>
                                            <span className="text-muted-foreground text-sm">
                                              Duration:
                                            </span>
                                            <span className="ml-2 font-medium text-base">
                                              {typeof med.duration === "string"
                                                ? med.duration
                                                : ""}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {med.instructions && (
                                        <p className="text-sm text-muted-foreground mt-2 p-3 bg-green-100 dark:bg-green-900/30 rounded italic">
                                          📋{" "}
                                          {typeof med.instructions === "string"
                                            ? med.instructions
                                            : JSON.stringify(med.instructions)}
                                        </p>
                                      )}
                                      {med.sideEffects && (
                                        <div className="mt-3 text-sm p-3 bg-orange-50 dark:bg-orange-900/30 rounded">
                                          <span className="text-muted-foreground font-medium">
                                            ⚠️ Possible side effects:
                                          </span>
                                          <span className="ml-2 text-orange-700 dark:text-orange-400">
                                            {Array.isArray(med.sideEffects)
                                              ? med.sideEffects.join(", ")
                                              : typeof med.sideEffects ===
                                                "string"
                                              ? med.sideEffects
                                              : "See prescription"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {/* Notes section for prescriptions */}
                            {safeEvent.doctorInfo?.notes && (
                              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                <span className="text-muted-foreground font-medium text-sm">
                                  Notes:
                                </span>
                                <p className="text-foreground mt-1 text-base">
                                  {safeEvent.doctorInfo.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Doctor Information - for Consultations */}
                      {safeEvent.doctorInfo &&
                        safeEvent.eventType === "consultation" && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 mb-5 border border-purple-200 dark:border-purple-800">
                            <h5 className="font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                              <Stethoscope className="h-5 w-5 text-purple-600" />
                              🩺 Doctor Consultation
                            </h5>

                            {/* Consultation Date & Time */}
                            <div className="mb-4 pb-4 border-b border-purple-200 dark:border-purple-800">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-muted-foreground text-sm font-medium">
                                    Date & Time:
                                  </span>
                                  <p className="font-medium text-foreground mt-1">
                                    {format(
                                      parseEventDate(safeEvent.date),
                                      "PPP"
                                    )}{" "}
                                    at{" "}
                                    {format(
                                      parseEventDate(safeEvent.date),
                                      "p"
                                    )}
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({formatRelativeTime(safeEvent.date)})
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-sm font-medium">
                                    Doctor:
                                  </span>
                                  <p className="font-medium text-foreground mt-1">
                                    {typeof safeEvent.doctorInfo.name ===
                                    "string"
                                      ? safeEvent.doctorInfo.name
                                      : "Doctor"}
                                  </p>
                                  {safeEvent.doctorInfo.specialization && (
                                    <p className="text-muted-foreground text-sm">
                                      {typeof safeEvent.doctorInfo
                                        .specialization === "string"
                                        ? safeEvent.doctorInfo.specialization
                                        : ""}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {safeEvent.doctorInfo.diagnosis && (
                                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-purple-400/30 dark:border-purple-400/20 rounded-lg p-4">
                                  <span className="text-muted-foreground font-medium text-sm">
                                    DIAGNOSIS:
                                  </span>
                                  <p className="mt-1 text-foreground text-base">
                                    {typeof safeEvent.doctorInfo.diagnosis ===
                                    "string"
                                      ? safeEvent.doctorInfo.diagnosis
                                      : JSON.stringify(
                                          safeEvent.doctorInfo.diagnosis
                                        )}
                                  </p>
                                </div>
                              )}
                              {safeEvent.doctorInfo.treatmentPlan && (
                                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-purple-400/30 dark:border-purple-400/20 rounded-lg p-4">
                                  <span className="text-muted-foreground font-medium text-sm">
                                    TREATMENT PLAN:
                                  </span>
                                  <p className="mt-1 text-foreground text-base">
                                    {typeof safeEvent.doctorInfo
                                      .treatmentPlan === "string"
                                      ? safeEvent.doctorInfo.treatmentPlan
                                      : JSON.stringify(
                                          safeEvent.doctorInfo.treatmentPlan
                                        )}
                                  </p>
                                </div>
                              )}
                              {safeEvent.doctorInfo.notes && (
                                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
                                  <span className="text-muted-foreground font-medium text-sm">
                                    📝 DOCTOR'S NOTES:
                                  </span>
                                  <p className="mt-1 text-foreground text-base">
                                    {typeof safeEvent.doctorInfo.notes ===
                                    "string"
                                      ? safeEvent.doctorInfo.notes
                                      : JSON.stringify(
                                          safeEvent.doctorInfo.notes
                                        )}
                                  </p>
                                </div>
                              )}
                              {safeEvent.doctorInfo.nextConsultation && (
                                <div className="flex items-center gap-3 p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                  <Calendar className="h-5 w-5 text-purple-600" />
                                  <div>
                                    <span className="text-sm text-muted-foreground">
                                      Next Consultation:
                                    </span>
                                    <span className="ml-2 font-medium text-purple-700 dark:text-purple-400 text-base">
                                      {format(
                                        parseEventDate(
                                          safeEvent.doctorInfo.nextConsultation
                                        ),
                                        "PPP"
                                      )}
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (
                                        {formatRelativeTime(
                                          safeEvent.doctorInfo.nextConsultation
                                        )}
                                        )
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Metrics Section - Health Progress Indicators */}
                      {safeEvent.metrics &&
                        typeof safeEvent.metrics === "object" &&
                        Object.keys(safeEvent.metrics).length > 0 && (
                          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-5 mb-5 border border-teal-200 dark:border-teal-800">
                            <h5 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Activity className="h-5 w-5 text-teal-600" />
                              📈 Health Progress Indicators
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {Object.entries(safeEvent.metrics).map(
                                ([key, value]) => {
                                  // Define units and normal ranges for common metrics
                                  const metricInfo: {
                                    [key: string]: {
                                      unit: string;
                                      icon: string;
                                      normal?: string;
                                    };
                                  } = {
                                    blood_pressure: {
                                      unit: "mmHg",
                                      icon: "🩸",
                                      normal: "120/80",
                                    },
                                    heart_rate: {
                                      unit: "bpm",
                                      icon: "❤️",
                                      normal: "60-100",
                                    },
                                    blood_sugar: {
                                      unit: "mg/dL",
                                      icon: "🍬",
                                      normal: "70-100",
                                    },
                                    weight: { unit: "kg", icon: "⚖️" },
                                    temperature: {
                                      unit: "°C",
                                      icon: "🌡️",
                                      normal: "36.5-37.5",
                                    },
                                    oxygen_level: {
                                      unit: "%",
                                      icon: "💨",
                                      normal: ">95",
                                    },
                                  };

                                  const info = metricInfo[
                                    key.toLowerCase()
                                  ] || {
                                    unit: "",
                                    icon: "📊",
                                  };
                                  const displayName = key
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase());

                                  return (
                                    <div
                                      key={key}
                                      className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm border border-teal-400/30 dark:border-teal-400/20 p-4 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">
                                          {info.icon}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                          {displayName}
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-foreground">
                                          {typeof value === "string" ||
                                          typeof value === "number"
                                            ? value
                                            : JSON.stringify(value)}
                                        </span>
                                        {info.unit && (
                                          <span className="text-sm text-muted-foreground">
                                            {info.unit}
                                          </span>
                                        )}
                                      </div>
                                      {info.normal && (
                                        <span className="text-xs text-muted-foreground mt-1 block">
                                          Normal: {info.normal}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {/* Trend indicator if available */}
                            {safeEvent.riskLevel && (
                              <div className="mt-4 pt-4 border-t border-teal-200 dark:border-teal-800 flex items-center gap-2">
                                <TrendingUp
                                  className={`h-5 w-5 ${
                                    safeEvent.riskLevel === "low"
                                      ? "text-green-600"
                                      : safeEvent.riskLevel === "medium"
                                      ? "text-orange-600"
                                      : "text-red-600"
                                  }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                  Risk Level Changes:
                                  <Badge
                                    className={`ml-2 ${
                                      safeEvent.riskLevel === "low"
                                        ? "bg-green-100 text-green-800"
                                        : safeEvent.riskLevel === "medium"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {safeEvent.riskLevel
                                      .charAt(0)
                                      .toUpperCase() +
                                      safeEvent.riskLevel.slice(1)}
                                  </Badge>
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Notes */}
                      {safeEvent.notes && (
                        <div className="bg-accent/50 rounded-lg p-4 mb-5">
                          <p className="text-base text-foreground">
                            <strong className="text-muted-foreground">
                              Notes:
                            </strong>{" "}
                            {typeof safeEvent.notes === "string"
                              ? safeEvent.notes
                              : JSON.stringify(safeEvent.notes)}
                          </p>
                        </div>
                      )}

                      {/* Description */}
                      {safeEvent.description &&
                        safeEvent.description !== safeEvent.summary && (
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-5">
                            <p className="text-base text-foreground">
                              {typeof safeEvent.description === "string"
                                ? safeEvent.description
                                : JSON.stringify(safeEvent.description)}
                            </p>
                          </div>
                        )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-5">
                        {safeEvent.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`view-report-${index}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Report
                          </Button>
                        )}
                        {safeEvent.reportId && (
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`download-report-${index}`}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

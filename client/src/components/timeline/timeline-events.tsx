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

interface TimelineEventsProps {
  events: any[];
  isLoading: boolean;
}

export default function TimelineEvents({
  events,
  isLoading,
}: TimelineEventsProps) {
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
        return new Date(dateValue);
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
    if (riskLevel === "high") return "bg-red-100 text-red-800 border-red-200";
    if (riskLevel === "medium")
      return "bg-orange-100 text-orange-800 border-orange-200";

    switch (eventType) {
      case "scan":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "prescription":
      case "medication_change":
        return "bg-green-100 text-green-800 border-green-200";
      case "consultation":
      case "appointment":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "lab_result":
      case "uploaded_report":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "health_metric":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

    return typeMap[eventType] || eventType.replace(/_/g, " ");
  };

  const getRiskLevelBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;

    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-orange-100 text-orange-800",
      high: "bg-red-100 text-red-800",
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
      Low: "bg-green-100 text-green-800",
      Moderate: "bg-orange-100 text-orange-800",
      High: "bg-red-100 text-red-800",
      Critical: "bg-red-600 text-white",
    };

    return (
      <Badge
        className={
          colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }
      >
        {severity}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Health Timeline
        </CardTitle>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events in timeline
            </h3>
            <p className="text-muted-foreground">
              Your health events will appear here as you upload reports,
              prescriptions, and medical records
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-start space-x-4"
                data-testid={`timeline-event-${index}`}
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getEventIcon(event.eventType, event.reportType)}
                  </div>
                  {index < events.length - 1 && (
                    <div
                      className="w-px h-full bg-border mt-2"
                      style={{ minHeight: "60px" }}
                    />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-semibold text-lg text-foreground">
                          {event.title}
                        </h4>
                        <Badge
                          className={getEventColor(
                            event.eventType,
                            event.riskLevel
                          )}
                        >
                          {getEventTypeDisplay(
                            event.eventType,
                            event.reportType
                          )}
                        </Badge>
                        {event.riskLevel && getRiskLevelBadge(event.riskLevel)}
                        {event.severityLevel &&
                          getSeverityBadge(event.severityLevel)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(
                          parseEventDate(event.date),
                          "MMMM d, yyyy • h:mm a"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  {event.summary && (
                    <div className="mb-4">
                      <p className="text-sm text-foreground leading-relaxed">
                        {typeof event.summary === "string"
                          ? event.summary
                          : JSON.stringify(event.summary)}
                      </p>
                    </div>
                  )}

                  {/* Upload Info - Date and Type */}
                  {event.eventType === "uploaded_report" ||
                    (event.reportType && (
                      <div className="bg-slate-50 dark:bg-slate-950/20 rounded-lg p-3 mb-4 border border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground font-medium">
                              Upload Date:
                            </span>
                            <p className="font-semibold text-foreground mt-1">
                              {format(parseEventDate(event.date), "PPP")} at{" "}
                              {format(parseEventDate(event.date), "p")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">
                              Report Type:
                            </span>
                            <p className="font-semibold text-foreground mt-1">
                              {getEventTypeDisplay(
                                event.eventType,
                                event.reportType
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Analysis Section - for Lab Results and Scans */}
                  {event.analysis &&
                    event.analysis.keyFindings &&
                    Array.isArray(event.analysis.keyFindings) && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mb-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            🔬 AI Analysis Results
                          </h5>
                          {event.severityLevel && (
                            <Badge
                              className={
                                event.severityLevel === "Critical"
                                  ? "bg-red-600 text-white"
                                  : event.severityLevel === "High"
                                  ? "bg-red-100 text-red-800"
                                  : event.severityLevel === "Moderate"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              Severity: {event.severityLevel}
                            </Badge>
                          )}
                        </div>

                        {/* Scan-specific header */}
                        {(event.reportType === "x-ray" ||
                          event.reportType === "mri" ||
                          event.reportType === "ct_scan" ||
                          event.eventType === "scan") && (
                          <div className="mb-3 pb-3 border-b border-blue-200 dark:border-blue-800 text-xs">
                            <span className="text-muted-foreground">
                              Diagnostic Result:
                            </span>
                            <p className="font-medium text-foreground mt-1">
                              {event.analysis.diagnosis ||
                                event.analysis.summary ||
                                "AI analysis completed"}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          {event.analysis.keyFindings.map(
                            (finding: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between p-2 bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 rounded border border-blue-400/30 dark:border-blue-400/20"
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-sm">
                                    {typeof finding.parameter === "string"
                                      ? finding.parameter
                                      : "Finding " + (idx + 1)}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {typeof finding.explanation === "string"
                                      ? finding.explanation
                                      : ""}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="font-bold text-sm">
                                    {typeof finding.value === "string" ||
                                    typeof finding.value === "number"
                                      ? finding.value
                                      : ""}
                                  </span>
                                  {finding.normalRange && (
                                    <p className="text-xs text-muted-foreground">
                                      {typeof finding.normalRange === "string"
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
                        {event.comparisonData && (
                          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                            <h6 className="font-semibold text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              COMPARISON TO PREVIOUS SCAN
                            </h6>
                            <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 rounded p-3 text-xs">
                              {typeof event.comparisonData === "string" ? (
                                <p className="text-foreground">
                                  {event.comparisonData}
                                </p>
                              ) : event.comparisonData.trend ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">Trend:</span>
                                    <Badge
                                      className={
                                        event.comparisonData.trend ===
                                        "improving"
                                          ? "bg-green-100 text-green-800"
                                          : event.comparisonData.trend ===
                                            "stable"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-red-100 text-red-800"
                                      }
                                    >
                                      {event.comparisonData.trend}
                                    </Badge>
                                  </div>
                                  {event.comparisonData.notes && (
                                    <p className="text-muted-foreground">
                                      {event.comparisonData.notes}
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

                        {event.analysis.recommendations &&
                          Array.isArray(event.analysis.recommendations) &&
                          event.analysis.recommendations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                              <h6 className="font-semibold text-xs text-muted-foreground mb-2">
                                💡 RECOMMENDATIONS
                              </h6>
                              <ul className="space-y-1">
                                {event.analysis.recommendations.map(
                                  (rec: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-foreground flex items-start gap-2"
                                    >
                                      <span className="text-blue-600 mt-0.5">
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
                  {event.medications &&
                    Array.isArray(event.medications) &&
                    event.medications.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 mb-4 border border-green-200 dark:border-green-800">
                        <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                          <Pill className="h-4 w-4 text-green-600" />
                          💊 Prescribed Medications
                        </h5>

                        {/* Doctor & Prescription Info */}
                        {(event.doctorInfo?.name || event.date) && (
                          <div className="mb-3 pb-3 border-b border-green-200 dark:border-green-800">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {event.doctorInfo?.name && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Prescribed by:
                                  </span>
                                  <p className="font-medium text-foreground">
                                    {event.doctorInfo.name}
                                  </p>
                                  {event.doctorInfo.specialization && (
                                    <p className="text-muted-foreground text-xs">
                                      {event.doctorInfo.specialization}
                                    </p>
                                  )}
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">
                                  Date Prescribed:
                                </span>
                                <p className="font-medium text-foreground">
                                  {format(
                                    parseEventDate(event.date),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          {event.medications.map((med: any, idx: number) => {
                            // Calculate status based on dates
                            const getStatus = () => {
                              if (med.status) return med.status;
                              if (med.endDate) {
                                const endDate = parseEventDate(med.endDate);
                                if (endDate < new Date()) return "completed";
                              }
                              if (med.isActive === false) return "expired";
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
                                className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 rounded-lg p-3 border border-green-400/30 dark:border-green-400/20"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h6 className="font-semibold text-sm text-foreground">
                                    {typeof med.name === "string"
                                      ? med.name
                                      : "Medication"}
                                  </h6>
                                  <div className="flex gap-2">
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
                                      className="text-xs"
                                    >
                                      {med.frequency || "As directed"}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Dosage:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {typeof med.dosage === "string"
                                        ? med.dosage
                                        : "See prescription"}
                                    </span>
                                  </div>
                                  {med.duration && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Duration:
                                      </span>
                                      <span className="ml-2 font-medium">
                                        {typeof med.duration === "string"
                                          ? med.duration
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {med.instructions && (
                                  <p className="text-xs text-muted-foreground mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded italic">
                                    📋{" "}
                                    {typeof med.instructions === "string"
                                      ? med.instructions
                                      : JSON.stringify(med.instructions)}
                                  </p>
                                )}
                                {med.sideEffects && (
                                  <div className="mt-2 text-xs p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                                    <span className="text-muted-foreground font-medium">
                                      ⚠️ Possible side effects:
                                    </span>
                                    <span className="ml-2 text-orange-700 dark:text-orange-400">
                                      {Array.isArray(med.sideEffects)
                                        ? med.sideEffects.join(", ")
                                        : typeof med.sideEffects === "string"
                                        ? med.sideEffects
                                        : "See prescription"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes section for prescriptions */}
                        {event.doctorInfo?.notes && (
                          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 text-xs">
                            <span className="text-muted-foreground font-medium">
                              Notes:
                            </span>
                            <p className="text-foreground mt-1">
                              {event.doctorInfo.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Doctor Information - for Consultations */}
                  {event.doctorInfo && event.eventType === "consultation" && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-800">
                      <h5 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-purple-600" />
                        🩺 Doctor Consultation
                      </h5>

                      {/* Consultation Date & Time */}
                      <div className="mb-3 pb-3 border-b border-purple-200 dark:border-purple-800">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">
                              Date & Time:
                            </span>
                            <p className="font-medium text-foreground mt-1">
                              {format(parseEventDate(event.date), "PPP")} at{" "}
                              {format(parseEventDate(event.date), "p")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Doctor:
                            </span>
                            <p className="font-medium text-foreground mt-1">
                              {typeof event.doctorInfo.name === "string"
                                ? event.doctorInfo.name
                                : "Doctor"}
                            </p>
                            {event.doctorInfo.specialization && (
                              <p className="text-muted-foreground text-xs">
                                {typeof event.doctorInfo.specialization ===
                                "string"
                                  ? event.doctorInfo.specialization
                                  : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        {event.doctorInfo.diagnosis && (
                          <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 rounded-lg p-3 border border-purple-400/30 dark:border-purple-400/20">
                            <span className="text-muted-foreground font-medium text-xs">
                              DIAGNOSIS:
                            </span>
                            <p className="mt-1 text-foreground">
                              {typeof event.doctorInfo.diagnosis === "string"
                                ? event.doctorInfo.diagnosis
                                : JSON.stringify(event.doctorInfo.diagnosis)}
                            </p>
                          </div>
                        )}
                        {event.doctorInfo.treatmentPlan && (
                          <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 rounded-lg p-3 border border-purple-400/30 dark:border-purple-400/20">
                            <span className="text-muted-foreground font-medium text-xs">
                              TREATMENT PLAN:
                            </span>
                            <p className="mt-1 text-foreground">
                              {typeof event.doctorInfo.treatmentPlan ===
                              "string"
                                ? event.doctorInfo.treatmentPlan
                                : JSON.stringify(
                                    event.doctorInfo.treatmentPlan
                                  )}
                            </p>
                          </div>
                        )}
                        {event.doctorInfo.notes && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-100 dark:border-amber-900">
                            <span className="text-muted-foreground font-medium text-xs">
                              📝 DOCTOR'S NOTES:
                            </span>
                            <p className="mt-1 text-foreground text-xs">
                              {typeof event.doctorInfo.notes === "string"
                                ? event.doctorInfo.notes
                                : JSON.stringify(event.doctorInfo.notes)}
                            </p>
                          </div>
                        )}
                        {event.doctorInfo.nextConsultation && (
                          <div className="flex items-center gap-2 p-3 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Next Consultation:
                              </span>
                              <span className="ml-2 font-medium text-purple-700 dark:text-purple-400">
                                {format(
                                  parseEventDate(
                                    event.doctorInfo.nextConsultation
                                  ),
                                  "PPP"
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metrics Section - Health Progress Indicators */}
                  {event.metrics &&
                    typeof event.metrics === "object" &&
                    Object.keys(event.metrics).length > 0 && (
                      <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg p-4 mb-4 border border-teal-200 dark:border-teal-800">
                        <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-teal-600" />
                          📈 Health Progress Indicators
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {Object.entries(event.metrics).map(([key, value]) => {
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

                            const info = metricInfo[key.toLowerCase()] || {
                              unit: "",
                              icon: "📊",
                            };
                            const displayName = key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase());

                            return (
                              <div
                                key={key}
                                className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-sm border-white/20 dark:border-white/10 p-3 rounded-lg border border-teal-400/30 dark:border-teal-400/20 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-base">{info.icon}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {displayName}
                                  </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-bold text-foreground">
                                    {typeof value === "string" ||
                                    typeof value === "number"
                                      ? value
                                      : JSON.stringify(value)}
                                  </span>
                                  {info.unit && (
                                    <span className="text-xs text-muted-foreground">
                                      {info.unit}
                                    </span>
                                  )}
                                </div>
                                {info.normal && (
                                  <span className="text-xs text-muted-foreground">
                                    Normal: {info.normal}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Trend indicator if available */}
                        {event.riskLevel && (
                          <div className="mt-3 pt-3 border-t border-teal-200 dark:border-teal-800 flex items-center gap-2">
                            <TrendingUp
                              className={`h-4 w-4 ${
                                event.riskLevel === "low"
                                  ? "text-green-600"
                                  : event.riskLevel === "medium"
                                  ? "text-orange-600"
                                  : "text-red-600"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              Risk Level Changes:
                              <Badge
                                className={`ml-2 ${
                                  event.riskLevel === "low"
                                    ? "bg-green-100 text-green-800"
                                    : event.riskLevel === "medium"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {event.riskLevel.charAt(0).toUpperCase() +
                                  event.riskLevel.slice(1)}
                              </Badge>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Notes */}
                  {event.notes && (
                    <div className="bg-accent/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-foreground">
                        <strong className="text-muted-foreground">
                          Notes:
                        </strong>{" "}
                        {typeof event.notes === "string"
                          ? event.notes
                          : JSON.stringify(event.notes)}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && event.description !== event.summary && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-foreground">
                        {typeof event.description === "string"
                          ? event.description
                          : JSON.stringify(event.description)}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    {event.fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`view-report-${index}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    )}
                    {event.reportId && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`download-report-${index}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

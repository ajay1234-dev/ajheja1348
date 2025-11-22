import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Download, Clock } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import { useDoctorSharedReports } from "@/hooks/use-share-with-doctor";

export default function DoctorSharedReports() {
  // Fetch shared reports for this doctor
  const { data: sharedReports, isLoading } = useDoctorSharedReports();

  const handleDownloadReport = (reportURL: string) => {
    // In a real implementation, this would download the report from S3 or Firebase
    // For now, we'll just open it in a new tab
    window.open(reportURL, "_blank");
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Shared Reports
        </h1>
        <p className="text-muted-foreground">
          Reports shared with you by your patients
        </p>
      </div>

      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Patient Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg"
                >
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !sharedReports || sharedReports.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="h-8 w-8 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">
                No shared reports yet
              </p>
              <p className="text-sm text-muted-foreground">
                Reports shared by your patients will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {report.patient?.profilePictureUrl ? (
                        <img
                          src={report.patient.profilePictureUrl}
                          alt={`${report.patient.firstName} ${report.patient.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {report.patient
                            ? `${report.patient.firstName} ${report.patient.lastName}`
                            : "Patient"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {report.reportName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {safeFormatDate(
                              new Date(report.timestamp).toISOString(),
                              "MMM dd, yyyy"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadReport(report.reportURL)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

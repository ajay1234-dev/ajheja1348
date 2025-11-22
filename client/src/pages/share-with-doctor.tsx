import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, User, Send, CheckCircle } from "lucide-react";
import {
  useMappedDoctor,
  usePatientReports,
  useShareReportWithDoctor,
} from "@/hooks/use-share-with-doctor";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  profilePictureUrl?: string;
}

interface Report {
  id: string;
  fileName: string;
  status: string;
  reportType: string;
  createdAt: string;
  fileUrl: string;
}

export default function ShareWithDoctor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch the mapped doctor for this patient
  const { data: doctor, isLoading: isLoadingDoctor } = useMappedDoctor();

  // Fetch patient's reports
  const { data: reports, isLoading: isLoadingReports } = usePatientReports();

  // Mutation to share report with doctor
  const shareReportMutation = useShareReportWithDoctor();

  // Set the first doctor as selected by default if available
  useEffect(() => {
    if (doctor && doctor.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctor[0]);
    }
  }, [doctor, selectedDoctor]);

  const handleShareReport = () => {
    if (!user || !selectedDoctor || !selectedReport) return;

    shareReportMutation.mutate(
      {
        patientId: user.id,
        doctorId: selectedDoctor.id,
        reportId: selectedReport.id,
        reportName: selectedReport.fileName,
        reportURL: selectedReport.fileUrl,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Report sent to doctor successfully",
          });
          // Reset selections
          setSelectedDoctor(null);
          setSelectedReport(null);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description:
              error instanceof Error ? error.message : "Failed to share report",
            variant: "destructive",
          });
        },
      }
    );
  };

  const completedReports = (reports || []).filter(
    (report) => report.status === "completed"
  );

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Share Report with Doctor
        </h1>
        <p className="text-muted-foreground">
          Select a doctor and report to share with your healthcare provider
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doctor Selection */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <CardTitle>Your Assigned Doctor</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingDoctor ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 border border-border rounded-lg"
                  >
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !doctor || doctor.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No assigned doctor found
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your doctor will be assigned after uploading medical reports
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctor.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDoctor?.id === doc.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    {doc.profilePictureUrl ? (
                      <img
                        src={doc.profilePictureUrl}
                        alt={`${doc.firstName} ${doc.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        Dr. {doc.firstName} {doc.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.specialization}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.email}
                      </p>
                    </div>
                    {selectedDoctor?.id === doc.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Selection */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <CardTitle>Select Report to Share</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingReports ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 border border-border rounded-lg"
                  >
                    <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : completedReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No completed reports available to share
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedReports.map((report) => (
                  <div
                    key={report.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {report.fileName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {report.reportType.replace("_", " ").toUpperCase()} •
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedReport?.id === report.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Button */}
      {selectedDoctor && selectedReport && (
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">
                  Share "{selectedReport.fileName}" with Dr.{" "}
                  {selectedDoctor.firstName} {selectedDoctor.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will send the report to your doctor's dashboard
                </p>
              </div>
              <Button
                onClick={handleShareReport}
                disabled={shareReportMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {shareReportMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

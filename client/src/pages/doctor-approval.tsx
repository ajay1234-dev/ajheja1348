import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Stethoscope,
  Loader2,
  Bell,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

export default function DoctorApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [approvalStatus, setApprovalStatus] = useState<{
    [key: string]: "pending" | "approved" | "error";
  }>({});

  // Fetch pending doctor approvals
  const {
    data: pendingDoctors,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/patient/doctors"],
    queryFn: async () => {
      const response = await fetch("/api/patient/doctors", {
        credentials: "include",
      });
      if (!response.ok) {
        console.error(
          "Failed to fetch doctors:",
          response.status,
          response.statusText
        );
        throw new Error("Failed to fetch doctors");
      }
      const doctors = await response.json();
      console.log("All doctors fetched:", doctors);
      const pending = doctors.filter(
        (doctor: any) => doctor.approvalStatus === "pending"
      );
      console.log("Pending doctors:", pending);
      return pending;
    },
  });

  // Mutation for approving a doctor
  const approveMutation = useMutation({
    mutationFn: async (sharedReportId: string) => {
      if (!sharedReportId) {
        throw new Error("Invalid shared report ID");
      }
      const response = await apiRequest(
        "PUT",
        `/api/shared-reports/${sharedReportId}/approve`
      );
      return response.json();
    },
    onMutate: (sharedReportId: string) => {
      setApprovalStatus((prev) => ({ ...prev, [sharedReportId]: "pending" }));
    },
    onSuccess: (data, sharedReportId) => {
      setApprovalStatus((prev) => ({ ...prev, [sharedReportId]: "approved" }));
      toast({
        title: "✅ Doctor Approved!",
        description:
          "The doctor will now be able to see your reports and provide care.",
        duration: 5000,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/patient/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/doctor/shared-reports"],
      });

      // Refetch to update the list
      setTimeout(() => {
        refetch();
      }, 2000);
    },
    onError: (error, sharedReportId) => {
      setApprovalStatus((prev) => ({ ...prev, [sharedReportId]: "error" }));
      toast({
        title: "Approval Failed",
        description:
          error instanceof Error ? error.message : "Failed to approve doctor",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (sharedReportId: string) => {
    if (!sharedReportId) {
      toast({
        title: "Error",
        description: "Invalid shared report ID",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate(sharedReportId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Doctor Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve doctors suggested for your care
        </p>
      </div>

      {!pendingDoctors || pendingDoctors.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-muted-foreground mb-6">
              All suggested doctors have been approved or there are no
              suggestions at this time.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span>Pending Doctor Approvals</span>
                <Badge className="bg-amber-500 ml-2">
                  {pendingDoctors.length} Pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                The following doctors have been suggested based on your medical
                reports. Please review and approve those you wish to share your
                medical information with.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingDoctors.map((doctor: any) => (
              <Card
                key={doctor.id}
                className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 shadow-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <Badge className="bg-amber-500">
                          <Bell className="h-3 w-3 mr-1" />
                          Pending Approval
                        </Badge>
                      </div>

                      <div className="mt-2 space-y-2">
                        {doctor.specialization && (
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-muted-foreground">
                              Specialization:
                            </span>
                            <Badge variant="outline">
                              {doctor.specialization}
                            </Badge>
                          </div>
                        )}

                        {doctor.detectedSpecialization && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-muted-foreground">
                              AI Detected:
                            </span>
                            <Badge variant="outline">
                              {doctor.detectedSpecialization}
                            </Badge>
                          </div>
                        )}

                        {doctor.reportSummary && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {doctor.reportSummary}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => handleApprove(doctor.sharedReportId)}
                          disabled={
                            !doctor.sharedReportId ||
                            approvalStatus[doctor.sharedReportId] === "pending"
                          }
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {approvalStatus[doctor.sharedReportId] ===
                          "pending" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Doctor
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                        By approving, you allow this doctor to view your medical
                        reports and provide care.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

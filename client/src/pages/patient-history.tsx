import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserIcon,
  FileText,
  Activity,
  Stethoscope,
  Eye,
} from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PatientHistory() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients/history"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/patients/history", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch patient history");
      return response.json();
    },
  });

  const { data: patientData, isLoading: isLoadingPatientData } = useQuery({
    queryKey: ["/api/doctor/patient", selectedPatient?.id, "reports"],
    enabled: !!selectedPatient,
    queryFn: async () => {
      const response = await fetch(
        `/api/doctor/patient/${selectedPatient.id}/reports`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch patient data");
      return response.json();
    },
  });

  // Mutation to unhide patients from dashboard
  const unhidePatientMutation = useMutation({
    mutationFn: async ({
      sharedReportId,
      hide,
    }: {
      sharedReportId: string;
      hide: boolean;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/doctor/patients/${sharedReportId}/hide`,
        { hide }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient visibility updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/doctor/patients/history"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update patient visibility",
        variant: "destructive",
      });
    },
  });

  const filteredPatients = (patients || []).filter((patient: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="space-y-8 page-transition p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patient History</h1>
            <p className="text-muted-foreground">
              View all patients you've treated, including those removed from
              your dashboard
            </p>
          </div>
          <Button
            onClick={() => navigate("/doctor-dashboard")}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold">{patients?.length || 0}</p>
                </div>
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Hidden Patients
                  </p>
                  <p className="text-3xl font-bold">
                    {patients?.filter((p: any) => p.hideFromDashboard).length ||
                      0}
                  </p>
                </div>
                <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <Eye className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-red-500/50 transition-all duration-300 hover:scale-105 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Patients at Risk
                  </p>
                  <p className="text-3xl font-bold">
                    {patients?.filter((p: any) => p.lastReportSummary).length ||
                      0}
                  </p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
                data-testid="search-patients"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              Patient History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                  <UserIcon className="h-10 w-10 text-white" />
                </div>
                <p className="text-muted-foreground text-lg mb-2">
                  {searchTerm
                    ? "No patients found matching your search"
                    : "No patients in history yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Patients will appear here after they are assigned to you"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((patient: any) => {
                  const hasAbnormalities =
                    patient.lastReportSummary &&
                    (patient.lastReportSummary
                      .toLowerCase()
                      .includes("abnormal") ||
                      patient.lastReportSummary
                        .toLowerCase()
                        .includes("concern") ||
                      patient.lastReportSummary
                        .toLowerCase()
                        .includes("urgent"));

                  return (
                    <div
                      key={patient.id}
                      className={`bg-gray-50 dark:bg-slate-700 border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        hasAbnormalities
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-slate-600"
                      } ${patient.hideFromDashboard ? "opacity-70" : ""}`}
                      data-testid={`patient-card-${patient.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-4 flex-1 cursor-pointer"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          {patient.profilePictureUrl ? (
                            <img
                              src={patient.profilePictureUrl}
                              alt={`${patient.firstName} ${patient.lastName}`}
                              className={`w-16 h-16 rounded-lg object-cover border-2 ${
                                hasAbnormalities
                                  ? "border-red-500"
                                  : "border-primary"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                hasAbnormalities ? "bg-red-500" : "bg-primary"
                              }`}
                            >
                              <UserIcon className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {patient.email}
                            </p>
                            {hasAbnormalities && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                  Abnormalities Detected
                                </span>
                              </div>
                            )}
                            {patient.treatmentStatus === "completed" && (
                              <Badge className="mt-2 bg-green-500">
                                Treatment Completed
                              </Badge>
                            )}
                            {patient.hideFromDashboard && (
                              <Badge className="mt-2 bg-yellow-500">
                                Hidden from Dashboard
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {patient.age && (
                            <p className="text-sm font-medium">
                              Age: {patient.age} years
                            </p>
                          )}
                          {patient.lastReportDate && (
                            <p className="text-xs text-muted-foreground">
                              Last Report:{" "}
                              {safeFormatDate(
                                patient.lastReportDate,
                                "MMM dd, yyyy"
                              )}
                            </p>
                          )}
                          {patient.detectedSpecialization && (
                            <Badge className="mt-2">
                              {patient.detectedSpecialization}
                            </Badge>
                          )}
                          {patient.hideFromDashboard &&
                            patient.sharedReportId && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  unhidePatientMutation.mutate({
                                    sharedReportId: patient.sharedReportId,
                                    hide: false,
                                  });
                                }}
                                disabled={unhidePatientMutation.isPending}
                                size="sm"
                                className="mt-2"
                              >
                                {unhidePatientMutation.isPending
                                  ? "Adding..."
                                  : "Add to Dashboard"}
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

        {/* Patient Details Dialog - Simplified version */}
        {/* In a real implementation, you would include the full patient details dialog here */}
      </div>
    </div>
  );
}

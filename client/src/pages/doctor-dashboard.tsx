import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserIcon,
  FileText,
  Pill,
  Activity,
  Share2,
  Clock,
  TrendingUp,
  Stethoscope,
  Bell,
  CheckCircle,
  Eye,
} from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import {
  HeroCarousel,
  DOCTOR_CAROUSEL_IMAGES,
} from "@/components/ui/hero-carousel";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DoctorDashboard() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedSharedReport, setSelectedSharedReport] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/patients", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
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

  const { data: sharedReports, isLoading: isLoadingShared } = useQuery<any[]>({
    queryKey: ["/api/doctor/shared-reports"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/shared-reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch shared reports");
      return response.json();
    },
  });

  // Get pending approvals (shared reports with approvalStatus === 'pending')
  const pendingApprovals = (sharedReports || []).filter(
    (report: any) => report.approvalStatus === "pending"
  );

  // Mutation to mark treatment as complete
  const markCompleteMutation = useMutation({
    mutationFn: async (sharedReportId: string) => {
      const response = await apiRequest(
        "PUT",
        `/api/shared-reports/${sharedReportId}/complete`
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Treatment marked as complete. Patient has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/doctor/patients"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/doctor/shared-reports"],
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to mark as complete",
        variant: "destructive",
      });
    },
  });

  // Mutation to hide/unhide patients from dashboard
  const hidePatientMutation = useMutation({
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
      !patient.hideFromDashboard &&
      (patient.firstName?.toLowerCase().includes(searchLower) ||
        patient.lastName?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower))
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
        {/* Hero Section with Auto-Scrolling Carousel */}
        <div className="relative mb-6">
          <HeroCarousel
            images={DOCTOR_CAROUSEL_IMAGES}
            className="h-64 md:h-80 lg:h-96 w-full"
            autoPlayInterval={5000}
            showControls={true}
            showIndicators={true}
          >
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg flex items-center justify-center gap-3">
                {user?.profilePictureUrl ? (
                  <Avatar className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 border-2 border-white shadow-lg">
                    <AvatarImage
                      src={user.profilePictureUrl}
                      alt={`Dr. ${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="bg-primary text-white text-lg md:text-xl lg:text-2xl font-bold">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-primary rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-white" />
                  </div>
                )}
                Dr. {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-white/90 text-base md:text-lg lg:text-xl drop-shadow-md flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                {user?.specialization && (
                  <Badge className="bg-white/90 text-slate-900 text-sm md:text-base">
                    {user.specialization}
                  </Badge>
                )}
                <span className="hidden sm:inline">
                  View and manage your patients' health records and reports
                </span>
              </p>
            </div>
          </HeroCarousel>
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
                  <p className="text-3xl font-bold">
                    {patients?.filter((p: any) => !p.hideFromDashboard)
                      .length || 0}
                  </p>
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
                    Shared Reports
                  </p>
                  <p className="text-3xl font-bold">
                    {sharedReports?.length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <Share2 className="h-8 w-8 text-white" />
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
                    {patients?.filter(
                      (p: any) => p.lastReportSummary && !p.hideFromDashboard
                    ).length || 0}
                  </p>
                </div>
                <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center transition-transform duration-300 hover:rotate-12">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="patients" data-testid="tab-patients">
              <UserIcon className="h-4 w-4 mr-2" />
              My Patients
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Bell className="h-4 w-4 mr-2" />
              Pending Approvals
              {pendingApprovals && pendingApprovals.length > 0 && (
                <Badge className="ml-2 bg-amber-500">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shared" data-testid="tab-shared">
              <Share2 className="h-4 w-4 mr-2" />
              Shared with Me
              {sharedReports && sharedReports.length > 0 && (
                <Badge className="ml-2">{sharedReports.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
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
                  Patients
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
                        : "No patients yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Patients will appear here when they are assigned to you"}
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
                          }`}
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
                                    hasAbnormalities
                                      ? "bg-red-500"
                                      : "bg-primary"
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
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Treatment Completed
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
                              {patient.treatmentStatus !== "completed" &&
                                patient.sharedReportId && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markCompleteMutation.mutate(
                                        patient.sharedReportId
                                      );
                                    }}
                                    disabled={markCompleteMutation.isPending}
                                    size="sm"
                                    className="mt-2 bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {markCompleteMutation.isPending
                                      ? "Marking..."
                                      : "Mark Complete"}
                                  </Button>
                                )}
                              {patient.sharedReportId && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        "Are you sure you want to remove this patient from your dashboard? They will still be visible in your patient history."
                                      )
                                    ) {
                                      hidePatientMutation.mutate({
                                        sharedReportId: patient.sharedReportId,
                                        hide: true,
                                      });
                                    }
                                  }}
                                  disabled={hidePatientMutation.isPending}
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  {hidePatientMutation.isPending
                                    ? "Removing..."
                                    : "Remove"}
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
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  Pending Patient Approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingShared ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
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
                ) : !pendingApprovals || pendingApprovals.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                      <Bell className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-2">
                      No pending approvals
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Patients who need to approve you as their doctor will
                      appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovals.map((share: any) => (
                      <div
                        key={share.id}
                        className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                        data-testid={`pending-approval-${share.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                                <Bell className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {share.patient
                                    ? `${share.patient.firstName} ${share.patient.lastName}`
                                    : "Patient"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {share.patient?.email}
                                </p>
                                <Badge className="mt-1 bg-amber-500">
                                  Awaiting Patient Approval
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              {share.detectedSpecialization && (
                                <div className="flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-amber-600" />
                                  <span className="text-muted-foreground">
                                    Detected Specialization:
                                  </span>
                                  <Badge variant="outline">
                                    {share.detectedSpecialization}
                                  </Badge>
                                </div>
                              )}
                              {share.reportSummary && (
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div>
                                    <span className="text-muted-foreground">
                                      Report Summary:{" "}
                                    </span>
                                    <p className="text-sm mt-1">
                                      {share.reportSummary}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <span className="text-muted-foreground">
                                  Assigned:{" "}
                                  {safeFormatDate(
                                    share.createdAt,
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                📋 This patient has been assigned to you based
                                on AI analysis. They need to approve you before
                                you can access their full medical records.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-white" />
                  </div>
                  Reports Shared with Me
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingShared ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
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
                ) : !sharedReports || sharedReports.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-6">
                      <Share2 className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-muted-foreground text-lg mb-2">
                      No reports shared with you yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      When patients share their reports with your email, they
                      will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedReports.map((share: any) => (
                      <div
                        key={share.id}
                        className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedSharedReport(share)}
                        data-testid={`shared-report-${share.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                <Share2 className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {share.patient
                                    ? `${share.patient.firstName} ${share.patient.lastName}`
                                    : "Patient"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {share.patient?.email}
                                </p>
                              </div>
                              {!share.isActive && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {share.reports?.length || 0} reports
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Shared{" "}
                                {safeFormatDate(
                                  share.createdAt,
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSharedReport(share);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient Details Dialog */}
        <Dialog
          open={!!selectedPatient}
          onOpenChange={() => setSelectedPatient(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <div className="flex items-center gap-4">
                {selectedPatient?.profilePictureUrl ? (
                  <img
                    src={selectedPatient.profilePictureUrl}
                    alt={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                )}
                <DialogTitle className="text-2xl font-bold">
                  {selectedPatient &&
                    `${selectedPatient.firstName} ${selectedPatient.lastName}'s Records`}
                </DialogTitle>
              </div>
            </DialogHeader>

            {isLoadingPatientData ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : patientData ? (
              <div className="space-y-6">
                {/* Patient Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {patientData.patient?.email}
                        </p>
                      </div>
                      {patientData.patient?.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {patientData.patient.phone}
                          </p>
                        </div>
                      )}
                      {patientData.patient?.dateOfBirth && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Date of Birth
                          </p>
                          <p className="font-medium">
                            {safeFormatDate(
                              patientData.patient.dateOfBirth,
                              "MMM dd, yyyy"
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Details */}
                {(selectedPatient?.symptoms ||
                  selectedPatient?.description ||
                  selectedPatient?.detectedSpecialization) && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Referral Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedPatient?.detectedSpecialization && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            AI Detected Specialization
                          </p>
                          <Badge variant="default" className="mt-1">
                            {selectedPatient.detectedSpecialization}
                          </Badge>
                        </div>
                      )}
                      {selectedPatient?.symptoms && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reported Symptoms
                          </p>
                          <p className="font-medium">
                            {selectedPatient.symptoms}
                          </p>
                        </div>
                      )}
                      {selectedPatient?.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Additional Details
                          </p>
                          <p className="text-sm">
                            {selectedPatient.description}
                          </p>
                        </div>
                      )}
                      {selectedPatient?.lastReportSummary && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Report Summary
                          </p>
                          <p className="text-sm">
                            {selectedPatient.lastReportSummary}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Medical Reports ({patientData.reports?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientData.reports?.length > 0 ? (
                      <div className="space-y-3">
                        {patientData.reports.map((report: any) => (
                          <div
                            key={report.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <h4 className="font-semibold">
                                    {report.fileName}
                                  </h4>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                      report.status
                                    )}`}
                                  >
                                    {report.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Type: {report.reportType.replace("_", " ")}
                                </p>
                                {report.summary && (
                                  <p className="text-sm">{report.summary}</p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {safeFormatDate(
                                  report.createdAt,
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No reports available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Medications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Medications ({patientData.medications?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patientData.medications?.length > 0 ? (
                      <div className="space-y-3">
                        {patientData.medications.map((med: any) => (
                          <div key={med.id} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Pill className="h-5 w-5 text-primary mt-1" />
                              <div className="flex-1">
                                <h4 className="font-semibold">{med.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {med.dosage} - {med.frequency}
                                </p>
                                {med.instructions && (
                                  <p className="text-sm mt-1">
                                    {med.instructions}
                                  </p>
                                )}
                                {med.isActive && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No medications recorded
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Health Timeline Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Health Timeline</CardTitle>
                      <Button
                        onClick={() => {
                          setSelectedPatient(null);
                          navigate(
                            `/doctor/patient/${patientData.patient.id}/timeline`
                          );
                        }}
                        variant="outline"
                        size="sm"
                        data-testid="view-full-timeline"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Full Timeline
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {patientData.timeline?.length > 0 ? (
                      <div className="space-y-3">
                        {patientData.timeline.slice(0, 5).map((event: any) => (
                          <div
                            key={event.id}
                            className="border-l-2 border-primary pl-4"
                          >
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {safeFormatDate(event.date, "MMM dd, yyyy")}
                            </p>
                            {event.description && (
                              <p className="text-sm mt-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        ))}
                        {patientData.timeline.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            And {patientData.timeline.length - 5} more events...
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No timeline events yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Timeline events will appear as the patient uploads
                          reports or adds health data
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Shared Report Details Dialog */}
        <Dialog
          open={!!selectedSharedReport}
          onOpenChange={() => setSelectedSharedReport(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedSharedReport &&
                  selectedSharedReport.patient &&
                  `${selectedSharedReport.patient.firstName} ${selectedSharedReport.patient.lastName}'s Shared Reports`}
              </DialogTitle>
            </DialogHeader>

            {selectedSharedReport && (
              <div className="space-y-6">
                {/* Share Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Share Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Patient Email
                        </p>
                        <p className="font-medium">
                          {selectedSharedReport.patient?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Shared On
                        </p>
                        <p className="font-medium">
                          {safeFormatDate(
                            selectedSharedReport.createdAt,
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Expires On
                        </p>
                        <p className="font-medium">
                          {safeFormatDate(
                            selectedSharedReport.expiresAt,
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            selectedSharedReport.isActive
                              ? "default"
                              : "destructive"
                          }
                        >
                          {selectedSharedReport.isActive ? "Active" : "Expired"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Details for Shared Report */}
                {(selectedSharedReport.symptoms ||
                  selectedSharedReport.description ||
                  selectedSharedReport.detectedSpecialization) && (
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Referral Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedSharedReport.detectedSpecialization && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            AI Detected Specialization
                          </p>
                          <Badge variant="default" className="mt-1">
                            {selectedSharedReport.detectedSpecialization}
                          </Badge>
                        </div>
                      )}
                      {selectedSharedReport.symptoms && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reported Symptoms
                          </p>
                          <p className="font-medium">
                            {selectedSharedReport.symptoms}
                          </p>
                        </div>
                      )}
                      {selectedSharedReport.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Additional Details
                          </p>
                          <p className="text-sm">
                            {selectedSharedReport.description}
                          </p>
                        </div>
                      )}
                      {selectedSharedReport.reportSummary && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Report Summary
                          </p>
                          <p className="text-sm">
                            {selectedSharedReport.reportSummary}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Shared Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Shared Medical Reports (
                      {selectedSharedReport.reports?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSharedReport.reports?.length > 0 ? (
                      <div className="space-y-3">
                        {selectedSharedReport.reports.map((report: any) => (
                          <div
                            key={report.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <h4 className="font-semibold">
                                    {report.fileName}
                                  </h4>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                      report.status
                                    )}`}
                                  >
                                    {report.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Type: {report.reportType.replace("_", " ")}
                                </p>
                                {report.summary && (
                                  <p className="text-sm">{report.summary}</p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {safeFormatDate(
                                  report.createdAt,
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No reports in this share
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

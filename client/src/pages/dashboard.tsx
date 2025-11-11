import WelcomeSection from "@/components/dashboard/welcome-section";
import QuickStats from "@/components/dashboard/quick-stats";
import RecentReports from "@/components/dashboard/recent-reports";
import MedicationSchedule from "@/components/dashboard/medication-schedule";
import {
  HeroCarousel,
  PATIENT_CAROUSEL_IMAGES,
} from "@/components/ui/hero-carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  UserIcon,
  Stethoscope,
  Mail,
  Bell,
  Trash,
  FileText,
  Activity,
  Pill,
  Calendar,
  CheckCircle,
  Clipboard,
  FileTextIcon,
} from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import type {
  Report,
  Medication,
  Reminder,
  SharedReport as SharedReportSchema,
} from "@shared/schema";
import type { DashboardStats } from "@/types/medical";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  profilePictureUrl?: string | null;
}

interface AssignedDoctor extends Doctor {
  assignedDate?: Date;
  detectedSpecialization?: string | null;
  reportSummary?: string | null;
  approvalStatus?: string;
  treatmentStatus?: string;
  doctorId?: string;
  sharedReportId?: string;
}

interface HealthSummary {
  summaryText: string;
  healthScore: string;
  recommendations: string[];
  medications: string[];
  createdAt: Date;
}

interface Prescription {
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string | null;
    instructions: string | null;
    prescribedDate: Date;
  }[];
  notes: string | null;
  validityPeriod: Date;
  createdAt: Date;
}

export default function Dashboard() {
  const { speak } = useVoice();
  const [selectedDoctor, setSelectedDoctor] = useState<AssignedDoctor | null>(
    null
  );
  const [showHealthSummary, setShowHealthSummary] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  // Debug log for doctor selection
  useEffect(() => {
    if (selectedDoctor) {
      console.log("Selected doctor updated:", selectedDoctor);
    }
  }, [selectedDoctor]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery<Report[]>(
    {
      queryKey: ["/api/reports"],
    }
  );

  const { data: activeMedications, isLoading: medicationsLoading } = useQuery<
    Medication[]
  >({
    queryKey: ["/api/medications/active"],
  });

  // Fetch doctor details for approved shared reports with better error handling
  const { data: assignedDoctors = [], isLoading: doctorsLoading } = useQuery<
    AssignedDoctor[]
  >({
    queryKey: ["/api/patient/doctors"],
    queryFn: async () => {
      try {
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
        const data = await response.json();
        console.log("Fetched assigned doctors:", data);
        return data;
      } catch (error) {
        console.error("Error fetching doctors:", error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
    },
    // Cache for 10 minutes since doctor assignments don't change frequently
    staleTime: 10 * 60 * 1000,
    // Keep in cache for 15 minutes
    gcTime: 15 * 60 * 1000,
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery<Reminder[]>(
    {
      queryKey: ["/api/reminders"],
      // Cache for 2 minutes since reminders change more frequently
      staleTime: 2 * 60 * 1000,
    }
  );

  const { data: healthTimeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/timeline"],
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Fetch health summary with optimized caching
  const { data: healthSummary, isLoading: summaryLoading } =
    useQuery<HealthSummary>({
      queryKey: ["/api/health-summary"],
      enabled: showHealthSummary,
      queryFn: async () => {
        const response = await fetch("/api/health-summary", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch health summary");
        }
        return response.json();
      },
      // Cache for 15 minutes since health summary doesn't change frequently
      staleTime: 15 * 60 * 1000,
    });

  // Fetch monthly prescription with optimized caching
  const { data: monthlyPrescription, isLoading: prescriptionLoading } =
    useQuery<Prescription>({
      queryKey: ["/api/monthly-prescription"],
      enabled: showPrescription,
      queryFn: async () => {
        const response = await fetch("/api/monthly-prescription", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch prescription");
        }
        return response.json();
      },
      // Cache for 30 minutes since prescriptions don't change frequently
      staleTime: 30 * 60 * 1000,
    });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/reminders/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/active"] });
    },
  });

  // Voice announcement for dashboard
  useEffect(() => {
    if (stats) {
      const announcement = `Welcome to your health dashboard. You have ${stats.totalReports} reports, ${stats.activeMedications} active medications, and your health score is ${stats.healthScore}.`;
      speak(announcement);
    }
  }, [stats, speak]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="space-y-6 page-transition p-6">
        {/* Hero Section with Auto-Scrolling Carousel */}
        <div className="relative mb-6">
          <HeroCarousel
            images={PATIENT_CAROUSEL_IMAGES}
            className="h-64 md:h-80 lg:h-96 w-full"
            autoPlayInterval={5000}
            showControls={true}
            showIndicators={true}
          >
            <div className="text-center px-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
                Your Health Dashboard
              </h1>
              <p className="text-white/90 text-base md:text-lg lg:text-xl drop-shadow-md">
                Monitor your health journey with AI-powered insights
              </p>
            </div>
          </HeroCarousel>
        </div>

        <WelcomeSection />

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm"
              >
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <QuickStats stats={stats} />
        )}

        {/* Health Summary and Prescription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowHealthSummary(true)}
          >
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="flex items-center gap-2 font-bold">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileTextIcon className="h-4 w-4 text-white" />
                </div>
                Monthly Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Get your comprehensive health overview based on recent reports
                and medications
              </p>
              {stats && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Health Score:</span>
                  <Badge variant="default" className="text-sm">
                    {stats.healthScore}
                  </Badge>
                </div>
              )}
              <Button className="w-full mt-4" variant="outline">
                View Summary
              </Button>
            </CardContent>
          </Card>

          <Card
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowPrescription(true)}
          >
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2 font-bold">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Clipboard className="h-4 w-4 text-white" />
                </div>
                Monthly Prescription
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Review your current medications and prescription details
              </p>
              {activeMedications && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Active Medications:
                  </span>
                  <Badge variant="default" className="text-sm">
                    {activeMedications.length}
                  </Badge>
                </div>
              )}
              <Button className="w-full mt-4" variant="outline">
                View Prescription
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {reportsLoading ? (
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <RecentReports reports={recentReports?.slice(0, 3) || []} />
          )}

          {medicationsLoading ? (
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <MedicationSchedule medications={activeMedications || []} />
          )}
        </div>

        {/* Reminders Section */}
        {remindersLoading ? (
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : reminders && reminders.length > 0 ? (
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <CardTitle className="flex items-center gap-2 font-bold">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary-foreground" />
                </div>
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {reminders.slice(0, 4).map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {safeFormatDate(
                          reminder.scheduledTime,
                          "MMM d, yyyy h:mm a"
                        )}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                    >
                      <Trash className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              {reminders.length > 4 && (
                <Link href="/reminders">
                  <Button variant="ghost" size="sm" className="mt-3">
                    View all reminders
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Doctors Section - Only show if there are assigned doctors */}
        {doctorsLoading ? (
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : assignedDoctors && assignedDoctors.length > 0 ? (
          <Card
            data-testid="assigned-doctors-card"
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <CardTitle className="flex items-center gap-2 font-bold">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary-foreground" />
                </div>
                Your Doctors
                {assignedDoctors.some(
                  (d) => d.approvalStatus === "pending"
                ) && (
                  <Badge className="ml-2 bg-amber-500">Action Required</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {assignedDoctors.map((doctor) => {
                  const hasActiveTreatment =
                    doctor.treatmentStatus === "active";
                  const hasCompletedTreatment =
                    doctor.treatmentStatus === "completed";
                  const hasPendingApproval =
                    doctor.approvalStatus === "pending";

                  return (
                    <div
                      key={doctor.id}
                      className={`bg-gray-50 dark:bg-slate-700 border rounded-lg p-6 hover:shadow-md transition-shadow ${
                        hasPendingApproval
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                          : hasActiveTreatment
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : hasCompletedTreatment
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-slate-600"
                      }`}
                      data-testid={`doctor-card-${doctor.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center space-x-4 flex-1 cursor-pointer"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          {doctor.profilePictureUrl ? (
                            <img
                              src={doctor.profilePictureUrl}
                              alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                              className={`w-16 h-16 rounded-lg object-cover border-2 ${
                                hasPendingApproval
                                  ? "border-amber-500"
                                  : hasActiveTreatment
                                  ? "border-blue-500"
                                  : hasCompletedTreatment
                                  ? "border-green-500"
                                  : "border-primary"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                hasPendingApproval
                                  ? "bg-amber-500"
                                  : hasActiveTreatment
                                  ? "bg-blue-500"
                                  : hasCompletedTreatment
                                  ? "bg-green-500"
                                  : "bg-primary"
                              }`}
                            >
                              <UserIcon className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.email}
                            </p>
                            {hasPendingApproval && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                                  Pending Your Approval
                                </span>
                              </div>
                            )}
                            {hasActiveTreatment && !hasPendingApproval && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                  Active Treatment
                                </span>
                              </div>
                            )}
                            {hasCompletedTreatment && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                  Treatment Completed
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {doctor.specialization && (
                            <Badge className="mt-2">
                              {doctor.specialization}
                            </Badge>
                          )}
                          {doctor.assignedDate && (
                            <p className="text-xs text-muted-foreground">
                              Assigned:{" "}
                              {safeFormatDate(
                                doctor.assignedDate,
                                "MMM dd, yyyy"
                              )}
                            </p>
                          )}
                          {doctor.detectedSpecialization &&
                            doctor.detectedSpecialization !==
                              doctor.specialization && (
                              <p className="text-xs text-muted-foreground">
                                For: {doctor.detectedSpecialization}
                              </p>
                            )}
                          <Button
                            onClick={() => setSelectedDoctor(doctor)}
                            size="sm"
                            className="mt-2"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Health Timeline Section */}
        <Card
          data-testid="health-timeline-card"
          className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition"
        >
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                Health Timeline
              </CardTitle>
              <Link href="/timeline">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="view-full-timeline"
                  className="hover-lift"
                >
                  View Full Timeline
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : healthTimeline &&
              Array.isArray(healthTimeline) &&
              healthTimeline.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-primary/20">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      Timeline Events
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {healthTimeline.length}
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-blue-500/20">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      Reports
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.totalReports || 0}
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-green-500/20">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">
                      Medications
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.activeMedications || 0}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {healthTimeline.slice(0, 3).map((event: any) => (
                    <div
                      key={event.id}
                      className="p-4 border-2 border-border rounded-xl hover:shadow-lg hover:border-primary/30 smooth-transition hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {event.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 font-semibold">
                          {event.eventType}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-2">
                        {safeFormatDate(event.date, "MMM dd, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Track your health progress, view medical reports, and monitor
                  medication adherence over time.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4 text-muted-foreground"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <p className="text-muted-foreground mb-2">
                  No health timeline events yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload your first medical report to start tracking your health
                  journey
                </p>
                <Link href="/upload">
                  <Button className="mt-4" data-testid="upload-first-report">
                    Upload Report
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doctor Details Dialog */}
      <Dialog
        open={!!selectedDoctor}
        onOpenChange={(open) => {
          if (!open) setSelectedDoctor(null);
          console.log("Dialog state changed:", open, selectedDoctor);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <div className="flex items-center gap-4">
              {selectedDoctor?.profilePictureUrl ? (
                <img
                  src={selectedDoctor.profilePictureUrl}
                  alt={`Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
              )}
              <DialogTitle className="text-2xl font-bold">
                Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Doctor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDoctor?.email}</p>
                  </div>
                  {selectedDoctor?.specialization && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Specialization
                      </p>
                      <p className="font-medium">
                        {selectedDoctor?.specialization}
                      </p>
                    </div>
                  )}
                  {selectedDoctor?.assignedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Assigned Date
                      </p>
                      <p className="font-medium">
                        {safeFormatDate(
                          selectedDoctor.assignedDate,
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                  )}
                  {selectedDoctor?.approvalStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        className={`${
                          selectedDoctor.approvalStatus === "pending"
                            ? "bg-amber-500"
                            : selectedDoctor.treatmentStatus === "completed"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {selectedDoctor.approvalStatus === "pending"
                          ? "Pending Approval"
                          : selectedDoctor.treatmentStatus === "completed"
                          ? "Treatment Completed"
                          : "Active Treatment"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Referral Details */}
            {(selectedDoctor?.detectedSpecialization ||
              selectedDoctor?.reportSummary) && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Referral Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDoctor.detectedSpecialization && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        AI Detected Specialization
                      </p>
                      <Badge variant="default" className="mt-1">
                        {selectedDoctor.detectedSpecialization}
                      </Badge>
                    </div>
                  )}
                  {selectedDoctor.reportSummary && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Report Summary
                      </p>
                      <p className="text-sm">{selectedDoctor.reportSummary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {selectedDoctor?.approvalStatus === "pending" && (
              <div className="flex justify-end">
                <Link href="/doctor-approval">
                  <Button>Go to Doctor Approval</Button>
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Health Summary Dialog */}
      <Dialog open={showHealthSummary} onOpenChange={setShowHealthSummary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileTextIcon className="h-6 w-6 text-blue-500" />
              Monthly Health Summary
            </DialogTitle>
          </DialogHeader>

          {summaryLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : healthSummary ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Health Overview</CardTitle>
                    <Badge variant="default" className="text-lg">
                      {healthSummary.healthScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-left">
                    {healthSummary.summaryText}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {healthSummary.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  {healthSummary.medications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {healthSummary.medications.map((med, index) => (
                        <Badge key={index} variant="outline">
                          {med}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No active medications
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground text-center">
                Generated on{" "}
                {safeFormatDate(healthSummary.createdAt, "MMM dd, yyyy")}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Unable to generate health summary
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={showPrescription} onOpenChange={setShowPrescription}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Clipboard className="h-6 w-6 text-green-500" />
              Monthly Prescription
            </DialogTitle>
          </DialogHeader>

          {prescriptionLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
              <Skeleton className="h-16 w-full" />
            </div>
          ) : monthlyPrescription ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Current Medications
                    </CardTitle>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Valid until:{" "}
                      </span>
                      <span className="font-medium">
                        {safeFormatDate(
                          monthlyPrescription.validityPeriod,
                          "MMM dd, yyyy"
                        )}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {monthlyPrescription.medications.length > 0 ? (
                    <div className="space-y-4">
                      {monthlyPrescription.medications.map((med, index) => (
                        <div
                          key={index}
                          className="border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {med.name}
                              </h3>
                              <p className="text-muted-foreground">
                                {med.dosage} • {med.frequency}
                              </p>
                              {med.duration && (
                                <p className="text-sm text-muted-foreground">
                                  Duration: {med.duration}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">
                              {safeFormatDate(
                                med.prescribedDate,
                                "MMM dd, yyyy"
                              )}
                            </Badge>
                          </div>
                          {med.instructions && (
                            <p className="mt-2 text-sm bg-gray-50 dark:bg-slate-700 p-2 rounded">
                              <span className="font-medium">Instructions:</span>{" "}
                              {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No active medications prescribed
                    </p>
                  )}
                </CardContent>
              </Card>

              {monthlyPrescription.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Important Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{monthlyPrescription.notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                      Important Reminder
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Always consult with your healthcare provider before making
                      any changes to your medication regimen. This prescription
                      summary is for informational purposes only.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Generated on{" "}
                {safeFormatDate(monthlyPrescription.createdAt, "MMM dd, yyyy")}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clipboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Unable to generate prescription
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

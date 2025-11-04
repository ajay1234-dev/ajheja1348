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
import { UserIcon, Stethoscope, Mail, Bell, Trash, FileText, Activity, Pill, Calendar, CheckCircle } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import type { Report, Medication, Reminder, SharedReport as SharedReportSchema } from "@shared/schema";
import type { DashboardStats } from "@/types/medical";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
}

export default function Dashboard() {
  const { speak } = useVoice();
  const [selectedDoctor, setSelectedDoctor] = useState<AssignedDoctor | null>(null);
  
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

  const { data: sharedReports, isLoading: sharedReportsLoading } = useQuery<
    SharedReportSchema[]
  >({
    queryKey: ["/api/shared-reports"],
  });
  
  // Fetch doctor details for approved shared reports
  const { data: assignedDoctors, isLoading: doctorsLoading } = useQuery<
    AssignedDoctor[]
  >({
    queryKey: ["/api/patient/doctors", sharedReports],
    enabled: !!sharedReports,
    queryFn: async () => {
      if (!sharedReports || sharedReports.length === 0) return [];
      
      // Get unique doctor IDs from approved shared reports
      const approvedDoctorIds = sharedReports
        .filter(report => report.approvalStatus === "approved" && report.doctorId)
        .map(report => report.doctorId) as string[];
      
      if (approvedDoctorIds.length === 0) return [];
      
      // Fetch doctor details
      const doctorPromises = approvedDoctorIds.map(async (doctorId) => {
        const report = sharedReports.find(r => r.doctorId === doctorId);
        const response = await apiRequest("GET", `/api/doctors/${doctorId}`);
        const doctorData = await response.json();
        
        return {
          ...doctorData,
          assignedDate: report?.createdAt ? new Date(report.createdAt) : undefined,
          detectedSpecialization: report?.detectedSpecialization,
          reportSummary: report?.reportSummary,
          approvalStatus: report?.approvalStatus,
          treatmentStatus: report?.treatmentStatus,
          id: doctorId
        };
      });
      
      return Promise.all(doctorPromises);
    }
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery<Reminder[]>(
    {
      queryKey: ["/api/reminders"],
    }
  );

  const { data: healthTimeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/timeline"],
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {assignedDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      doctor.approvalStatus === "pending"
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 border-2"
                        : doctor.treatmentStatus === "completed"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                        : "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                    }`}
                    data-testid={`doctor-card-${doctor.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      {doctor.profilePictureUrl ? (
                        <img
                          src={doctor.profilePictureUrl}
                          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        {doctor.specialization && (
                          <Badge variant="outline" className="mt-1">
                            {doctor.specialization}
                          </Badge>
                        )}
                        <div className="mt-2">
                          <Link href={`/doctor-details/${doctor.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {doctor.email}
                        </div>
                        {doctor.approvalStatus === "pending" && (
                          <div className="mt-2">
                            <Badge className="bg-amber-500">
                              <Bell className="h-3 w-3 mr-1" />
                              Pending Your Approval
                            </Badge>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <Link
                                href="/doctor-approval"
                                className="underline hover:text-amber-800 dark:hover:text-amber-200"
                              >
                                Go to Doctor Approval page to approve this
                                doctor
                              </Link>
                            </p>
                          </div>
                        )}
                        {doctor.approvalStatus === "approved" &&
                          doctor.treatmentStatus === "active" && (
                            <Badge className="mt-2 bg-blue-500">
                              <Stethoscope className="h-3 w-3 mr-1" />
                              Active Treatment
                            </Badge>
                          )}
                        {doctor.treatmentStatus === "completed" && (
                          <Badge className="mt-2 bg-green-500">
                            <Bell className="h-3 w-3 mr-1" />
                            Treatment Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground mt-3">
                      {doctor.assignedDate && (
                        <p>
                          Assigned:{" "}
                          {safeFormatDate(doctor.assignedDate, "MMM dd, yyyy")}
                        </p>
                      )}
                      {doctor.detectedSpecialization &&
                        doctor.detectedSpecialization !==
                          doctor.specialization && (
                          <p className="text-xs mt-1">
                            For: {doctor.detectedSpecialization}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Doctors Section */}
        <Card
          data-testid="doctors-card"
          className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition"
        >
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b">
            <CardTitle className="flex items-center gap-2 font-bold">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary-foreground" />
              </div>
              Doctors Who Accepted Your Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {doctorsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : assignedDoctors && assignedDoctors.length > 0 ? (
              <div className="space-y-4">
                {assignedDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="bg-gray-50 dark:bg-slate-700 border rounded-lg p-6 hover:shadow-md transition-shadow border-gray-200 dark:border-slate-600"
                      data-testid={`doctor-card-${doctor.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {doctor.profilePictureUrl ? (
                            <img
                              src={doctor.profilePictureUrl}
                              alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-primary-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {doctor.email}
                            </div>
                            {doctor.specialization && (
                              <Badge variant="outline" className="mt-1">
                                {doctor.specialization}
                              </Badge>
                            )}
                            {doctor.detectedSpecialization && !doctor.specialization && (
                              <Badge variant="outline" className="mt-1">
                                {doctor.detectedSpecialization}
                              </Badge>
                            )}
                            {doctor.treatmentStatus === "active" && (
                              <Badge className="ml-2 mt-1 bg-blue-500">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Active Treatment
                              </Badge>
                            )}
                            {doctor.treatmentStatus === "completed" && (
                              <Badge className="ml-2 mt-1 bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Treatment Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Link href={`/doctor-details/${doctor.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                      <div className="text-right text-sm text-muted-foreground mt-3">
                        {doctor.assignedDate && (
                          <p>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Accepted on: {safeFormatDate(doctor.assignedDate, "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Doctors Yet</h3>
                <p className="text-muted-foreground mb-4">
                  No doctors have accepted your medical reports yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                      <p className="text-sm text-muted-foreground">Specialization</p>
                      <p className="font-medium">{selectedDoctor?.specialization}</p>
                    </div>
                  )}
                  {selectedDoctor?.assignedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Date</p>
                      <p className="font-medium">
                        {safeFormatDate(selectedDoctor.assignedDate, "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                  {selectedDoctor?.approvalStatus && (
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={`${
                        selectedDoctor.approvalStatus === "pending" 
                          ? "bg-amber-500" 
                          : selectedDoctor.treatmentStatus === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}>
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
            {selectedDoctor?.detectedSpecialization && (
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
                      <p className="text-sm text-muted-foreground">AI Detected Specialization</p>
                      <Badge variant="default" className="mt-1">
                        {selectedDoctor.detectedSpecialization}
                      </Badge>
                    </div>
                  )}
                  {selectedDoctor.reportSummary && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Report Summary</p>
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
                  <Button>
                    Go to Doctor Approval
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

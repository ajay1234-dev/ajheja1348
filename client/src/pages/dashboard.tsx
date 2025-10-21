import { useQuery } from "@tanstack/react-query";
import WelcomeSection from "@/components/dashboard/welcome-section";
import QuickStats from "@/components/dashboard/quick-stats";
import RecentReports from "@/components/dashboard/recent-reports";
import MedicationSchedule from "@/components/dashboard/medication-schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useEffect } from "react";
import { Link } from "wouter";
import { UserIcon, Stethoscope, Mail } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import type { Report, Medication } from "@shared/schema";
import type { DashboardStats } from "@/types/medical";

interface AssignedDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  assignedDate?: any;
  detectedSpecialization?: string;
  reportSummary?: string;
}

export default function Dashboard() {
  const { speak } = useVoice();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: activeMedications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications/active"],
  });

  const { data: assignedDoctors, isLoading: doctorsLoading} = useQuery<AssignedDoctor[]>({
    queryKey: ["/api/patient/doctors"],
  });

  const { data: healthTimeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/timeline"],
  });

  // Voice announcement for dashboard
  useEffect(() => {
    if (stats) {
      const announcement = `Welcome to your health dashboard. You have ${stats.totalReports} reports, ${stats.activeMedications} active medications, and your health score is ${stats.healthScore}.`;
      speak(announcement);
    }
  }, [stats, speak]);

  return (
    <div className="space-y-6 fade-in">
      <WelcomeSection />
      
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
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

      {/* Assigned Doctors Section */}
      {doctorsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : assignedDoctors && assignedDoctors.length > 0 ? (
        <Card data-testid="assigned-doctors-card" className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b">
            <CardTitle className="flex items-center gap-2 font-bold">
              <Stethoscope className="h-5 w-5 text-primary" />
              Your Doctors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {assignedDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-5 border-2 border-border rounded-xl hover:shadow-xl hover:border-primary/30 smooth-transition hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
                  data-testid={`doctor-card-${doctor.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      {doctor.specialization && (
                        <Badge variant="outline" className="mt-1">
                          {doctor.specialization}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {doctor.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {doctor.assignedDate && (
                      <p>Assigned: {safeFormatDate(doctor.assignedDate, 'MMM dd, yyyy')}</p>
                    )}
                    {doctor.detectedSpecialization && doctor.detectedSpecialization !== doctor.specialization && (
                      <p className="text-xs mt-1">For: {doctor.detectedSpecialization}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Health Timeline Section */}
      <Card data-testid="health-timeline-card" className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
              Health Timeline
            </CardTitle>
            <Link href="/timeline">
              <Button variant="outline" size="sm" data-testid="view-full-timeline" className="hover-lift">
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
          ) : healthTimeline && Array.isArray(healthTimeline) && healthTimeline.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-primary/20">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Timeline Events</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{healthTimeline.length}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-blue-500/20">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Reports</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats?.totalReports || 0}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover-lift smooth-transition shadow-md border-2 border-transparent hover:border-green-500/20">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Medications</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stats?.activeMedications || 0}</p>
                </div>
              </div>
              <div className="space-y-3">
                {healthTimeline.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="p-4 border-2 border-border rounded-xl hover:shadow-lg hover:border-primary/30 smooth-transition hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 font-semibold">{event.eventType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-2">
                      {safeFormatDate(event.date, 'MMM dd, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Track your health progress, view medical reports, and monitor medication adherence over time.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-muted-foreground">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
              <p className="text-muted-foreground mb-2">No health timeline events yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first medical report to start tracking your health journey
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
  );
}

import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { VoiceProvider } from "@/hooks/use-voice";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import DoctorDashboard from "@/pages/doctor-dashboard";
import DoctorApproval from "@/pages/doctor-approval";
import PatientTimeline from "@/pages/patient-timeline";
import PatientHistory from "@/pages/patient-history";
import Upload from "@/pages/upload";
import Reports from "@/pages/reports";
import Medications from "@/pages/medications";
import Timeline from "@/pages/timeline";
import Reminders from "@/pages/reminders";
import Share from "@/pages/share";
import ShareWithDoctor from "@/pages/share-with-doctor";
import DoctorSharedReports from "@/pages/doctor/shared-reports";
import ProfilePage from "@/pages/profile";
import HealthTimelineDemo from "@/pages/health-timeline-demo";
import HealthTimelineProductionDemo from "@/pages/health-timeline-production-demo";
import ScrollbarDemo from "@/pages/scrollbar-demo";
import MainLayout from "@/components/layout/main-layout";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    return (
      <Redirect
        to={user.role === "doctor" ? "/doctor-dashboard" : "/dashboard"}
      />
    );
  }

  return <MainLayout>{children}</MainLayout>;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role === "doctor") {
    return <DoctorDashboard />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected routes for both patients and doctors */}
      <Route path="/">
        <ProtectedRoute>
          <DashboardRouter />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["patient"]}>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/doctor-dashboard">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/doctor-approval">
        <ProtectedRoute allowedRoles={["patient"]}>
          <DoctorApproval />
        </ProtectedRoute>
      </Route>

      <Route path="/timeline">
        <ProtectedRoute>
          <Timeline />
        </ProtectedRoute>
      </Route>

      <Route path="/patient-timeline">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <PatientTimeline />
        </ProtectedRoute>
      </Route>

      <Route path="/patient-history">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <PatientHistory />
        </ProtectedRoute>
      </Route>

      <Route path="/upload">
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>

      <Route path="/medications">
        <ProtectedRoute>
          <Medications />
        </ProtectedRoute>
      </Route>

      <Route path="/reminders">
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      </Route>

      <Route path="/share">
        <ProtectedRoute>
          <Share />
        </ProtectedRoute>
      </Route>

      <Route path="/share-with-doctor">
        <ProtectedRoute allowedRoles={["patient"]}>
          <ShareWithDoctor />
        </ProtectedRoute>
      </Route>

      <Route path="/doctor/shared-reports">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorSharedReports />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>

      <Route path="/health-timeline-demo">
        <ProtectedRoute>
          <HealthTimelineDemo />
        </ProtectedRoute>
      </Route>

      <Route path="/health-timeline-production-demo">
        <ProtectedRoute>
          <HealthTimelineProductionDemo />
        </ProtectedRoute>
      </Route>

      <Route path="/scrollbar-demo">
        <ProtectedRoute>
          <ScrollbarDemo />
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VoiceProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </VoiceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

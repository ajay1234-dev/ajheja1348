import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import AnimatedList from "@/components/ui/animated-list";
import { ScrollGradients } from "@/components/ui";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Pill,
  Clock,
  Bell,
  Share,
  Heart,
  LogOut,
  Menu,
  X,
  UserCircle,
  Eye,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> &
      React.RefAttributes<SVGSVGElement>
  >;
  badge?: number;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  // Fetch pending doctor approvals
  const { data: pendingDoctors } = useQuery({
    queryKey: ["/api/patient/doctors"],
    queryFn: async () => {
      const response = await fetch("/api/patient/doctors", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const doctors = await response.json();
      return doctors.filter(
        (doctor: any) => doctor.approvalStatus === "pending"
      );
    },
    enabled: user?.role === "patient",
  });

  const patientNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Upload Report", href: "/upload", icon: Upload },
    {
      name: "Doctor Approval",
      href: "/doctor-approval",
      icon: UserCircle,
      badge:
        pendingDoctors && pendingDoctors.length > 0
          ? pendingDoctors.length
          : undefined,
    },
    { name: "My Reports", href: "/reports", icon: FileText },
    { name: "Medications", href: "/medications", icon: Pill },
    { name: "Health Timeline", href: "/timeline", icon: Clock },
    { name: "Timeline Demo", href: "/health-timeline-demo", icon: Heart },
    {
      name: "Production Demo",
      href: "/health-timeline-production-demo",
      icon: Heart,
    },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Share with Doctor", href: "/share", icon: Share },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ];

  const doctorNavigation: NavigationItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patient History", href: "/patient-history", icon: Eye },
    { name: "Profile", href: "/profile", icon: UserCircle },
  ];

  const navigation: NavigationItem[] =
    user?.role === "doctor" ? doctorNavigation : patientNavigation;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigationSelect = (item: string, index: number) => {
    const navItem = navigation[index];
    if (navItem) {
      // Navigate to the selected item using wouter
      setLocation(navItem.href);
      if (isMobile) {
        onClose();
      }
    }
  };

  const sidebarClasses = cn(
    "fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-lg transform transition-all duration-300 ease-in-out",
    {
      "translate-x-0": isOpen || !isMobile,
      "-translate-x-full": !isOpen && isMobile,
    }
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center soft-glow shadow-xl icon-static">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              MediCare
            </span>
          </div>

          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="sidebar-close"
              className="text-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation Menu with AnimatedList */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-2 sm:space-y-3 bg-white dark:bg-slate-800">
          <ScrollGradients className="h-full" hideScrollbar={true}>
            <AnimatedList
              items={navigation.map((item) => item.name)}
              onItemSelect={handleNavigationSelect}
              showGradients={false} // We're using our new component now
              enableArrowNavigation={true}
              displayScrollbar={false}
              className="w-full"
            />
          </ScrollGradients>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-3 sm:p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg bg-muted border border-gray-200 dark:border-slate-700 hover:bg-muted/80 transition-all">
            {user?.profilePictureUrl ? (
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary">
                <AvatarImage
                  src={user.profilePictureUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-primary-foreground">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-bold truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
              {user?.role && (
                <Badge className="mt-1 text-xs">{user.role}</Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start hover:bg-destructive/10 text-destructive rounded-lg transition-all text-xs sm:text-sm"
            data-testid="logout-button"
          >
            <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

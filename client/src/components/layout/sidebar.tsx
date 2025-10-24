import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
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
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const patientNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Upload Report", href: "/upload", icon: Upload },
  { name: "My Reports", href: "/reports", icon: FileText },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Health Timeline", href: "/timeline", icon: Clock },
  { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Share with Doctor", href: "/share", icon: Share },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

const doctorNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const navigation =
    user?.role === "doctor" ? doctorNavigation : patientNavigation;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const sidebarClasses = cn(
    "fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-lg transform transition-all duration-500 ease-in-out",
    {
      "translate-x-0": isOpen || !isMobile,
      "-translate-x-full": !isOpen && isMobile,
    }
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center soft-glow shadow-2xl icon-static">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
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

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 sm:px-6 py-6 sm:py-8 space-y-2 sm:space-y-3 smooth-scrollbar overflow-y-auto">
          {navigation.map((item, index) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 sm:px-5 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg transition-all",
                  {
                    "bg-primary text-primary-foreground border-2 border-primary/50 shadow-lg":
                      isActive,
                    "text-muted-foreground hover:text-foreground hover:bg-muted border-2 border-transparent":
                      !isActive,
                  }
                )}
                onClick={() => isMobile && onClose()}
                data-testid={`nav-${item.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-4",
                    {
                      "bg-white text-primary": isActive,
                      "bg-muted text-foreground": !isActive,
                    }
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="hidden sm:inline">{item.name}</span>
                <span className="sm:hidden text-xs">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 sm:p-6 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg bg-muted border border-gray-200 dark:border-slate-700 hover:bg-muted/80 transition-all">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-sm sm:text-lg font-bold text-primary-foreground">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
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

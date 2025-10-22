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
    "fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl transform transition-all duration-500 ease-in-out hover:shadow-sky-400/25",
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
              <Heart className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
              MediCare
            </span>
          </div>

          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="sidebar-close"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
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
                  "flex items-center px-3 sm:px-5 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl smooth-transition modern-card backdrop-blur-sm",
                  {
                    "text-white bg-gradient-to-r from-sky-400/20 to-purple-600/20 border-2 border-sky-400/50 shadow-lg scale-105 soft-glow":
                      isActive,
                    "text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 border-2 border-transparent":
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
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg",
                    {
                      "bg-gradient-to-br from-sky-400 to-blue-500 soft-glow ai-thinking":
                        isActive,
                      "bg-white/10": !isActive,
                    }
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
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
        <div className="border-t border-white/20 p-4 sm:p-6 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl glass-card backdrop-blur-sm bg-white/5 border border-white/20 hover:bg-white/10 smooth-transition modern-card">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl soft-glow ai-thinking">
              <span className="text-sm sm:text-lg font-bold text-white drop-shadow-lg">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-bold text-white truncate drop-shadow-md">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs sm:text-sm text-white/70 truncate drop-shadow-md">
                {user?.email}
              </p>
              {user?.role && (
                <Badge className="mt-1 bg-white/20 border-white/30 text-white backdrop-blur-sm text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-white/80 hover:text-white hover:bg-red-400/20 border-red-400/30 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
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

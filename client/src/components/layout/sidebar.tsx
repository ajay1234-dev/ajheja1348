import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
  UserCircle
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
  
  const navigation = user?.role === 'doctor' ? doctorNavigation : patientNavigation;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const sidebarClasses = cn(
    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-border shadow-xl transform transition-all duration-300 ease-in-out",
    {
      "translate-x-0": isOpen || !isMobile,
      "-translate-x-full": !isOpen && isMobile,
    }
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center pulse-ring shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">MediCare</span>
          </div>

          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="sidebar-close"
              className="hover-lift"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 smooth-scrollbar overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-semibold rounded-xl smooth-transition interactive-element",
                  {
                    "text-primary bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-md scale-105": isActive,
                    "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-700": !isActive,
                  }
                )}
                onClick={() => isMobile && onClose()}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center space-x-3 mb-3 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 smooth-transition">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg pulse-ring">
              <span className="text-base font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl hover-lift smooth-transition"
            data-testid="logout-button"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

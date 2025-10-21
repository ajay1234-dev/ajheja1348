import { useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "./sidebar";
import Header from "./header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden smooth-transition">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 smooth-scrollbar">
          <div className="max-w-7xl mx-auto fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

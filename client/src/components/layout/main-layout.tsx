import { useState, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper";
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
    <div className="flex h-screen bg-white dark:bg-slate-900">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse floating-particles"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700 floating-particles"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000 floating-particles"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500 floating-particles"></div>
      </div>

      <div className="relative z-10 flex h-screen w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-6 smooth-scrollbar">
            <PageTransition>
              <div className="max-w-7xl mx-auto">
                <StaggerContainer>
                  <StaggerItem>{children}</StaggerItem>
                </StaggerContainer>
              </div>
            </PageTransition>
          </main>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

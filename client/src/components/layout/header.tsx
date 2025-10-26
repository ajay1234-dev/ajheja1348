import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { useAuth } from "@/hooks/use-auth";
import LanguageSelector from "@/components/common/language-selector";
import NotificationCenter from "@/components/common/notification-center";
import VoiceControls from "@/components/common/voice-controls";
import { Menu, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true" || false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", (!isDarkMode).toString());
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 py-1 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover-lift"
            onClick={onMenuClick}
            data-testid="menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl font-bold text-foreground gradient-text">
              Health Dashboard
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {getGreeting()}, {user?.firstName}!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <LanguageSelector />

          <VoiceControls />

          <NotificationCenter />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            title="Toggle Dark Mode"
            data-testid="dark-mode-toggle"
            className="hover-lift rounded-full w-8 h-8 p-0"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-600" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

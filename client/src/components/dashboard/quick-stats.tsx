import { Card, CardContent } from "@/components/ui/card";
import {
  HoverMotion,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper";
import { FileText, Pill, Bell, Heart } from "lucide-react";
import type { DashboardStats } from "@/types/medical";

interface QuickStatsProps {
  stats?: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const defaultStats = {
    totalReports: 0,
    activeMedications: 0,
    pendingReminders: 0,
    healthScore: "0%",
  };

  const currentStats = stats || defaultStats;

  const statItems = [
    {
      label: "Total Reports",
      value: currentStats.totalReports,
      icon: FileText,
      color: "text-sky-400",
      bgColor: "bg-sky-400/20",
      gradient: "from-sky-400 to-blue-500",
    },
    {
      label: "Active Medications",
      value: currentStats.activeMedications,
      icon: Pill,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/20",
      gradient: "from-emerald-400 to-green-500",
    },
    {
      label: "Pending Reminders",
      value: currentStats.pendingReminders,
      icon: Bell,
      color: "text-amber-400",
      bgColor: "bg-amber-400/20",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "Health Score",
      value: currentStats.healthScore,
      icon: Heart,
      color: "text-pink-400",
      bgColor: "bg-pink-400/20",
      gradient: "from-pink-400 to-purple-500",
    },
  ];

  return (
    <StaggerContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={index}>
              <HoverMotion>
                <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white/80 uppercase tracking-wide drop-shadow-md">
                          {item.label}
                        </p>
                        <p
                          className="text-4xl font-bold text-white mt-2 drop-shadow-lg"
                          data-testid={`stat-${item.label
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {item.value}
                        </p>
                      </div>
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center shadow-xl soft-glow icon-static`}
                      >
                        <Icon className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </HoverMotion>
            </StaggerItem>
          );
        })}
      </div>
    </StaggerContainer>
  );
}

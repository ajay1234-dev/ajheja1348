import { Card, CardContent } from "@/components/ui/card";
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
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Active Medications",
      value: currentStats.activeMedications,
      icon: Pill,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Pending Reminders",
      value: currentStats.pendingReminders,
      icon: Bell,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Health Score",
      value: currentStats.healthScore,
      icon: Heart,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <Card
            key={index}
            className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition perspective-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6 card-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p
                    className="text-3xl font-bold text-foreground mt-2"
                    data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.value}
                  </p>
                </div>
                <div className={`w-14 h-14 ${item.bgColor} rounded-xl flex items-center justify-center pulse-ring smooth-transition`}>
                  <Icon className={`h-7 w-7 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

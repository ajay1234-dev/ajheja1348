import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { HoverMotion, FloatingMotion } from "@/components/ui/motion-wrapper";
import { UserRound } from "lucide-react";

export default function WelcomeSection() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <HoverMotion>
      <Card className="glass-card backdrop-blur-xl bg-gradient-to-r from-sky-400/10 via-blue-500/10 to-purple-600/10 dark:from-sky-400/20 dark:via-blue-500/20 dark:to-purple-600/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {getGreeting()}, {user?.firstName}!
              </h2>
              <p className="text-white/80 text-xl font-medium drop-shadow-md">
                Here's your health summary for today
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl soft-glow icon-static">
                <UserRound className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </HoverMotion>
  );
}

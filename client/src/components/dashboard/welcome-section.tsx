import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { UserRound } from "lucide-react";

export default function WelcomeSection() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 border-2 border-transparent hover:border-primary/30 shadow-xl hover-lift smooth-transition">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2 gradient-text">
              {getGreeting()}, {user?.firstName}!
            </h2>
            <p className="text-muted-foreground text-lg font-medium">
              Here's your health summary for today
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl pulse-ring float-animation">
              <UserRound className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

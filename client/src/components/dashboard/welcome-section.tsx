import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {getGreeting()}, {user?.firstName}!
              </h2>
              <p className="text-foreground text-xl font-medium">
                Here's your health summary for today
              </p>
            </div>
            <div className="hidden md:block">
              {user?.profilePictureUrl ? (
                <Avatar className="w-24 h-24 border-4 border-primary shadow-2xl soft-glow">
                  <AvatarImage
                    src={user.profilePictureUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 text-white text-2xl font-bold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-sky-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl soft-glow icon-static">
                  <UserRound className="h-12 w-12 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </HoverMotion>
  );
}

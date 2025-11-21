import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import FuzzyText from "@/components/ui/fuzzy-text";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-2xl mx-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-white dark:border-slate-700 shadow-xl">
        <CardContent className="pt-8 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <FuzzyText
              baseIntensity={0.2}
              hoverIntensity={0.5}
              enableHover={true}
              fontSize="clamp(4rem, 15vw, 8rem)"
              fontWeight={900}
              color="#4F46E5"
            >
              404
            </FuzzyText>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>

          <p className="mt-2 text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-8">
            Sorry, we couldn't find the page you're looking for. It might have
            been removed, renamed, or doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation("/")}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Go to Homepage
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="px-6 py-2 border-primary text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Need help? Contact support@example.com</p>
      </div>
    </div>
  );
}

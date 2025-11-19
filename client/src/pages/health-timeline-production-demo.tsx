import { useState } from "react";
import HealthChart from "@/components/timeline/health-chart-production";
import { generateSampleTimelineData } from "@/components/timeline/sample-data";
import { TimelineEvent } from "@/types/medical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function HealthTimelineProductionDemo() {
  const [data] = useState<TimelineEvent[]>(generateSampleTimelineData());
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Health Timeline Production Demo
          </h1>
          <p className="text-muted-foreground">
            Production-grade health timeline with comprehensive error handling
            and data sanitization
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-border shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Production-Grade Health Timeline
          </CardTitle>
          <p className="text-muted-foreground">
            This demo showcases the production-grade health timeline with
            comprehensive error handling, data sanitization, and dynamic metric
            categorization.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="text-sm">
                <span className="font-medium">Key Features:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>
                    Universal value sanitizer for handling null/undefined/string
                    values
                  </li>
                  <li>
                    Safe domain calculation with compression for large values
                  </li>
                  <li>
                    Dynamic metric categorization based on keyword detection
                  </li>
                  <li>Error boundaries to prevent component crashes</li>
                  <li>Safe tooltip rendering with null checks</li>
                  <li>
                    Responsive grid layout with minimum sizing requirements
                  </li>
                  <li>Automatic filter generation for new metrics</li>
                  <li>Safe date parsing and formatting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Trends Chart */}
      <HealthChart
  data={data}
  isLoading={isLoading}
/>
    </div>
  );
}

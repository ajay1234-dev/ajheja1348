import { useState } from "react";
import HealthChart from "@/components/timeline/health-chart-enhanced";
import { generateSampleTimelineData } from "@/components/timeline/sample-data";
import { TimelineEvent } from "@/types/medical";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function HealthTimelineDemo() {
  const timeRange = "all";
  const metricType = "all";
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
            Health Timeline Demo
          </h1>
          <p className="text-muted-foreground">
            Enhanced health timeline with dynamic metrics and auto-scaling
            charts
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
            Enhanced Health Timeline
          </CardTitle>
          <p className="text-muted-foreground">
            This demo showcases the enhanced health timeline with improved
            auto-scaling, responsive layout, and dynamic metric detection.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="text-sm">
                <span className="font-medium">Features:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>
                    Automatic Y-axis scaling per metric (min = smallest value -
                    10%, max = largest value + 10%)
                  </li>
                  <li>Handles metrics with no variation (identical values)</li>
                  <li>
                    Proper value formatting (commas for &gt;10,000, 2 decimals
                    for &lt;1, text handling)
                  </li>
                  <li>
                    Auto-wrapping responsive layout (3-4 cards desktop, 2
                    tablet, 1 mobile)
                  </li>
                  <li>Minimum card size (260-300px width, 180-220px height)</li>
                  <li>Individual metric trend calculation</li>
                  <li>Overall combined chart with proper scaling</li>
                  <li>Dynamic metric detection without hardcoding</li>
                  <li>Clean, modern UI with rounded cards and soft shadows</li>
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

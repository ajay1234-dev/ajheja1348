import { useState } from "react";
import HealthChart from "@/components/timeline/health-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineEvent } from "@/types/medical";

// Sample data generator for demonstration
const generateSampleTimelineData = (): TimelineEvent[] => {
  return [
    {
      date: "2024-01-15",
      metrics: {
        systolic: 135,
        diastolic: 85,
        glucose: 95,
        hdl: 48,
        ldl: 140,
        total_cholesterol: 220,
      },
      reportName: "Annual Physical Exam.pdf",
    },
    {
      date: "2024-02-20",
      metrics: {
        systolic: 130,
        diastolic: 82,
        glucose: 92,
        hdl: 52,
        ldl: 130,
        total_cholesterol: 210,
        bone_density: "Normal",
      },
      reportName: "Follow-up Blood Work.pdf",
    },
    {
      date: "2024-03-10",
      metrics: {
        systolic: 125,
        diastolic: 78,
        glucose: 88,
        hdl: 55,
        ldl: 115,
        total_cholesterol: 195,
      },
      reportName: "Quarterly Checkup.pdf",
      prescriptions: ["Lisinopril 10mg"],
    },
    {
      date: "2024-04-05",
      metrics: {
        systolic: 122,
        diastolic: 75,
        glucose: 85,
        hdl: 58,
        ldl: 105,
        total_cholesterol: 185,
        ef: 60,
        troponin: 0.03,
      },
      reportName: "Cardiology Consultation.pdf",
    },
    {
      date: "2024-05-18",
      metrics: {
        systolic: 118,
        diastolic: 72,
        glucose: 82,
        hdl: 60,
        ldl: 95,
        total_cholesterol: 175,
        ef: 62,
        troponin: 0.02,
        gfr: 85,
        creatinine: 0.9,
      },
      reportName: "Comprehensive Panel.pdf",
    },
    {
      date: "2024-06-22",
      metrics: {
        systolic: 115,
        diastolic: 70,
        glucose: 80,
        hdl: 62,
        ldl: 90,
        total_cholesterol: 170,
        ef: 65,
        troponin: 0.01,
        gfr: 88,
        creatinine: 0.8,
        sgpt: 25,
        sgot: 22,
      },
      reportName: "Six-Month Review.pdf",
      prescriptions: ["Atorvastatin 20mg"],
    },
  ];
};

export default function HealthTimelineDemoV3() {
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>(
    generateSampleTimelineData()
  );
  const [isLoading, setIsLoading] = useState(false);

  const addNewReport = () => {
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const newData = [...timelineData];

      // Add a new report with additional metrics
      const newReport: TimelineEvent = {
        date: new Date().toISOString().split("T")[0],
        metrics: {
          systolic: 112,
          diastolic: 68,
          glucose: 78,
          hdl: 65,
          ldl: 85,
          total_cholesterol: 165,
          ef: 67,
          troponin: 0.01,
          gfr: 90,
          creatinine: 0.7,
          sgpt: 22,
          sgot: 20,
          bilirubin: 0.5,
          // New metrics that should automatically create new categories
          vitamin_d: 35,
          magnesium: 1.8,
        },
        reportName: "Latest Health Assessment.pdf",
      };

      newData.push(newReport);
      setTimelineData(newData);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Dynamic Health Timeline v3
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fully dynamic health timeline with combined chart and individual
          metric cards. Automatic categorization and filtering based on medical
          keywords.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl font-bold">
              Health Timeline Dashboard
            </CardTitle>
            <Button onClick={addNewReport} disabled={isLoading}>
              {isLoading ? "Processing..." : "Simulate New Report Upload"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h2 className="font-semibold text-foreground mb-2">Features</h2>
            <ul className="list-disc list-inside text-sm text-foreground space-y-1">
              <li>Combined timeline chart showing all metrics</li>
              <li>Individual mini charts for each metric</li>
              <li>Dynamic filters based on metric categories</li>
              <li>Automatic categorization using keyword detection</li>
              <li>
                Event markers for reports, prescriptions, and consultations
              </li>
              <li>Real-time updates when new data is added</li>
            </ul>
          </div>

          <HealthChart
            data={timelineData}
            timeRange="all"
            metricType="all"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Sample Data Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(generateSampleTimelineData()[0], null, 2)}
          </pre>
          <p className="mt-4 text-muted-foreground">
            The system works with any JSON structure that follows this format.
            All metrics are automatically detected, categorized, and visualized.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

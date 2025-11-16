import { useState } from "react";
import HealthChart from "@/components/timeline/health-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineEvent } from "@/types/medical";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Activity,
  Heart,
  Droplets,
  Zap,
  Bone,
  Waves,
  Leaf,
} from "lucide-react";

// Metric category definitions
const METRIC_CATEGORIES: Record<
  string,
  {
    name: string;
    icon: React.ReactNode;
    keywords: string[];
  }
> = {
  blood: {
    name: "Blood Metrics",
    icon: <Heart className="h-4 w-4" />,
    keywords: ["bp", "pressure", "blood"],
  },
  sugar: {
    name: "Sugar Metrics",
    icon: <Droplets className="h-4 w-4" />,
    keywords: ["sugar", "glucose", "hba1c"],
  },
  cholesterol: {
    name: "Cholesterol Metrics",
    icon: <Droplets className="h-4 w-4" />,
    keywords: ["cholesterol", "hdl", "ldl", "lipid", "triglycerides"],
  },
  ecg: {
    name: "Heart / ECG",
    icon: <Zap className="h-4 w-4" />,
    keywords: [
      "ecg",
      "cardiac",
      "heart",
      "treadmill",
      "ejection",
      "fraction",
      "st",
      "qt",
    ],
  },
  bone: {
    name: "Bone Health",
    icon: <Bone className="h-4 w-4" />,
    keywords: ["bone", "density", "calcium"],
  },
  kidney: {
    name: "Kidney Metrics",
    icon: <Waves className="h-4 w-4" />,
    keywords: ["creatinine", "gfr", "kidney", "renal"],
  },
  liver: {
    name: "Liver Metrics",
    icon: <Leaf className="h-4 w-4" />,
    keywords: ["liver", "alt", "ast", "bilirubin"],
  },
  other: {
    name: "Other Metrics",
    icon: <Activity className="h-4 w-4" />,
    keywords: [],
  },
};

// Sample data generator for demonstration
const generateSampleTimelineData = (): TimelineEvent[] => {
  return [
    {
      date: "2024-01-15",
      metrics: {
        blood_pressure_systolic: 135,
        blood_pressure_diastolic: 85,
        hba1c: 7.8,
        hdl_cholesterol: 45,
        ldl_cholesterol: 140,
        total_cholesterol: 220,
        triglycerides: 175,
        ejection_fraction: 55,
        qt_interval: 420,
        bone_density: "Normal",
        creatinine: 1.2,
        gfr: 75,
      },
      reportName: "Annual Physical Exam.pdf",
    },
    {
      date: "2024-03-22",
      metrics: {
        blood_pressure_systolic: 130,
        blood_pressure_diastolic: 82,
        hba1c: 7.5,
        hdl_cholesterol: 48,
        ldl_cholesterol: 130,
        total_cholesterol: 210,
        triglycerides: 160,
        ejection_fraction: 58,
        qt_interval: 415,
        bone_density: "Normal",
        creatinine: 1.1,
        gfr: 78,
        alt: 35,
        ast: 30,
      },
      reportName: "Follow-up Blood Work.pdf",
    },
    {
      date: "2024-06-10",
      metrics: {
        blood_pressure_systolic: 125,
        blood_pressure_diastolic: 78,
        hba1c: 7.2,
        hdl_cholesterol: 52,
        ldl_cholesterol: 115,
        total_cholesterol: 195,
        triglycerides: 140,
        ejection_fraction: 60,
        qt_interval: 410,
        bone_density: "Slightly Low",
        creatinine: 1.0,
        gfr: 82,
        alt: 32,
        ast: 28,
        tsh: 2.1,
      },
      reportName: "Quarterly Checkup.pdf",
    },
    {
      date: "2024-09-05",
      metrics: {
        blood_pressure_systolic: 122,
        blood_pressure_diastolic: 75,
        hba1c: 6.8,
        hdl_cholesterol: 55,
        ldl_cholesterol: 105,
        total_cholesterol: 185,
        triglycerides: 125,
        ejection_fraction: 62,
        qt_interval: 405,
        bone_density: "Low",
        creatinine: 0.9,
        gfr: 85,
        alt: 28,
        ast: 25,
        tsh: 1.9,
        ck_mb: 8.2,
      },
      reportName: "Cardiology Consultation.pdf",
    },
    {
      date: "2024-12-18",
      metrics: {
        blood_pressure_systolic: 118,
        blood_pressure_diastolic: 72,
        hba1c: 6.5,
        hdl_cholesterol: 58,
        ldl_cholesterol: 95,
        total_cholesterol: 175,
        triglycerides: 110,
        ejection_fraction: 65,
        qt_interval: 400,
        bone_density: "Low",
        creatinine: 0.8,
        gfr: 88,
        alt: 25,
        ast: 22,
        tsh: 1.8,
        ck_mb: 7.5,
        crp: 1.2,
        homocysteine: 9.5,
      },
      reportName: "Year-End Comprehensive Panel.pdf",
    },
  ];
};

export default function HealthTimelineDemoV2() {
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
          blood_pressure_systolic: 115,
          blood_pressure_diastolic: 70,
          hba1c: 6.2,
          hdl_cholesterol: 60,
          ldl_cholesterol: 90,
          total_cholesterol: 170,
          triglycerides: 105,
          ejection_fraction: 67,
          qt_interval: 395,
          bone_density: "Stable",
          creatinine: 0.7,
          gfr: 90,
          alt: 22,
          ast: 20,
          tsh: 1.7,
          ck_mb: 7.0,
          crp: 0.8,
          homocysteine: 8.5,
          // New metrics that should automatically create new categories
          vitamin_d: 35,
          magnesium: 1.8,
          uric_acid: 5.2,
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
          Dynamic Health Timeline v2
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fully dynamic health timeline with separate charts for each metric,
          automatic categorization, and intelligent filtering based on medical
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
            <h2 className="font-semibold text-foreground mb-2">How It Works</h2>
            <ul className="list-disc list-inside text-sm text-foreground space-y-1">
              <li>Upload medical reports with any health metrics</li>
              <li>
                System automatically detects all metrics and creates dynamic
                categories
              </li>
              <li>
                Each metric gets its own mini-chart with trend line and
                predictions
              </li>
              <li>
                Filters are generated automatically based on keyword detection
              </li>
              <li>
                No tooltips - all information is displayed directly in each
                chart
              </li>
              <li>System updates automatically when new reports are added</li>
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

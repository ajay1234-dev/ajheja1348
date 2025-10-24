import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Play, FileText, Clock } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";
import { safeFormatDate } from "@/lib/date-utils";
import type { Report } from "@shared/schema";

interface RecentReportsProps {
  reports: Report[];
}

export default function RecentReports({ reports }: RecentReportsProps) {
  const { speak } = useVoice();

  const handlePlayAudio = (summary: string) => {
    speak(summary || "Report analysis is being processed.");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700";
      case "processing":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700";
    }
  };

  const getReportTypeDisplay = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            Latest Reports
          </CardTitle>
          <Link href="/reports">
            <Button variant="outline" size="sm" data-testid="view-all-reports">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-4">
              No reports uploaded yet
            </p>
            <Link href="/upload">
              <Button className="mt-4" data-testid="upload-first-report">
                Upload Your First Report
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">
                        {getReportTypeDisplay(report.reportType)}
                      </h4>
                      <Badge
                        className={`${getStatusColor(
                          report.status || "processing"
                        )}`}
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.fileName}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-2" />
                      {safeFormatDate(report.createdAt)}
                    </div>
                  </div>

                  {report.summary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayAudio(report.summary || "")}
                      title="Listen to report summary"
                      data-testid={`play-audio-${report.id}`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {report.summary && (
                  <div className="bg-muted/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                    <h5 className="text-sm font-semibold mb-2">Summary:</h5>
                    <p className="text-sm text-muted-foreground">
                      {report.summary}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <Link href={`/reports/${report.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`view-report-${report.id}`}
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        return "bg-green-400/20 text-green-300 border-green-400/30";
      case "processing":
        return "bg-amber-400/20 text-amber-300 border-amber-400/30";
      case "failed":
        return "bg-red-400/20 text-red-300 border-red-400/30";
      default:
        return "bg-white/20 text-white/80 border-white/30";
    }
  };

  const getReportTypeDisplay = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
      <CardHeader className="border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3 text-white drop-shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center soft-glow">
              <FileText className="h-5 w-5 text-white drop-shadow-lg" />
            </div>
            Latest Reports
          </CardTitle>
          <Link href="/reports">
            <Button
              variant="outline"
              size="sm"
              data-testid="view-all-reports"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
            >
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 soft-glow icon-static">
              <FileText className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
            <p className="text-white/80 text-lg mb-4 drop-shadow-md">
              No reports uploaded yet
            </p>
            <Link href="/upload">
              <Button
                className="mt-4 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600 hover:from-sky-500 hover:via-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-sky-400/25 transition-all duration-300 transform hover:scale-105"
                data-testid="upload-first-report"
              >
                Upload Your First Report
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="glass-card backdrop-blur-sm bg-white/5 border-2 border-white/20 rounded-2xl p-6 hover:shadow-xl hover:border-sky-400/30 smooth-transition modern-card"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white text-lg drop-shadow-md">
                        {getReportTypeDisplay(report.reportType)}
                      </h4>
                      <Badge
                        className={`${getStatusColor(
                          report.status
                        )} backdrop-blur-sm border-white/20`}
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70 mb-2 drop-shadow-md">
                      {report.fileName}
                    </p>
                    <div className="flex items-center text-xs text-white/60">
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
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {report.summary && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <h5 className="text-sm font-semibold text-white mb-2 drop-shadow-md">
                      Summary:
                    </h5>
                    <p className="text-sm text-white/80 drop-shadow-md">
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
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
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

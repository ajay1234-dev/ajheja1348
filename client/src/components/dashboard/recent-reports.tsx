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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeDisplay = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="shadow-lg hover-lift border-2 border-transparent hover:border-primary/20 smooth-transition">
      <CardHeader className="border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Latest Reports
          </CardTitle>
          <Link href="/reports">
            <Button variant="outline" size="sm" data-testid="view-all-reports" className="hover-lift">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reports uploaded yet</p>
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
                className="border-2 border-border rounded-xl p-5 hover:shadow-xl hover:border-primary/30 smooth-transition hover-lift bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {getReportTypeDisplay(report.reportType)}
                      </h4>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {report.fileName}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {safeFormatDate(report.createdAt)}
                    </div>
                  </div>
                  
                  {report.summary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayAudio(report.summary || '')}
                      title="Listen to report summary"
                      data-testid={`play-audio-${report.id}`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {report.summary && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-foreground mb-2">
                      Summary:
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {report.summary}
                    </p>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center">
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

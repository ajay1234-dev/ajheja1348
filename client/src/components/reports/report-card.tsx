import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { useVoice } from "@/hooks/use-voice";
import { Play, FileText, Clock, Download, Share, Trash2 } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import type { Report } from "@shared/schema";
import AnalysisSummary from "./analysis-summary";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const { speak } = useVoice();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report deleted",
        description:
          "The report has been successfully deleted from your records.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description:
          error.message || "Failed to delete the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlayAudio = () => {
    if (report.summary) {
      speak(report.summary);
    } else {
      speak("Report analysis is still being processed.");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medical_report_${report.id}_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg text-white drop-shadow-lg">
                {getReportTypeDisplay(report.reportType)}
              </CardTitle>
              <Badge className={getStatusColor(report.status || "processing")}>
                {report.status || "processing"}
              </Badge>
            </div>

            <p className="text-sm text-white/70 mb-1 drop-shadow-md">
              {report.fileName}
            </p>

            <div className="flex items-center text-xs text-white/60 drop-shadow-md">
              <Clock className="h-3 w-3 mr-1" />
              {safeFormatDate(report.createdAt, "MMM d, yyyy h:mm a")}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {report.summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayAudio}
                title="Listen to report summary"
                data-testid={`play-audio-${report.id}`}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={report.status !== "completed"}
              title={
                report.status === "completed"
                  ? "Download report"
                  : "Report must be completed to download"
              }
              data-testid={`download-${report.id}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {report.status === "completed" && report.analysis ? (
          <AnalysisSummary analysis={report.analysis} />
        ) : report.status === "processing" ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Processing your report...
            </p>
          </div>
        ) : report.status === "failed" ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600 mb-2">
              Failed to process report
            </p>
            <p className="text-xs text-muted-foreground">
              Please try uploading the document again
            </p>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Report uploaded successfully. Analysis will appear here once
              processing is complete.
            </p>
          </div>
        )}

        {report.summary && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">
              Summary:
            </h5>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              data-testid={`view-details-${report.id}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {report.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                data-testid={`share-report-${report.id}`}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>

          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                data-testid={`delete-report-${report.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this report? This action
                  cannot be undone and will permanently remove the report from
                  your records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="cancel-delete">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="confirm-delete"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

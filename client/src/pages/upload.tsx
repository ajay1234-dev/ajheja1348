import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DragDropZone from "@/components/upload/drag-drop-zone";
import UploadReportForm from "@/components/upload/upload-report-form";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HeroImage, MEDICAL_IMAGES } from "@/components/ui/hero-image";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Upload as UploadIcon,
  FileUp,
} from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";
import type { Report } from "@shared/schema";

export default function Upload() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    refetchInterval: 5000,
  });

  const recentUploads = reports?.slice(0, 5) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "processing":
        return (
          <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin" />
        );
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
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
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section with Image Background */}
      <div className="relative mb-6 rounded-lg overflow-hidden">
        <img
          src={MEDICAL_IMAGES.upload}
          alt="Medical Document Upload"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* Page Title Section */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Upload Medical Documents
            </h1>
            <p className="text-white drop-shadow-md">
              Upload your medical reports, prescriptions, and lab results for
              AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 page-transition p-6">
        {/* Upload Options */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="enhanced" className="space-y-8">
            <TabsList className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="enhanced" data-testid="tab-enhanced">
                <FileUp className="h-4 w-4 mr-2" />
                With Details
              </TabsTrigger>
              <TabsTrigger value="quick" data-testid="tab-quick">
                <UploadIcon className="h-4 w-4 mr-2" />
                Quick Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8">
                <UploadReportForm />
              </div>
            </TabsContent>

            <TabsContent value="quick">
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8">
                <DragDropZone
                  onUploadProgress={setUploadProgress}
                  uploadProgress={uploadProgress}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Uploads */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                Recent Uploads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg"
                    >
                      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg mb-2">
                    No documents uploaded yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your uploaded documents will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUploads.map((report: Report) => (
                    <div
                      key={report.id}
                      className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                      data-testid={`upload-${report.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary-foreground" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg">
                                {report.fileName}
                              </h4>
                              <Badge
                                className={`${getStatusColor(
                                  report.status || "processing"
                                )}`}
                              >
                                <span className="flex items-center gap-2">
                                  {getStatusIcon(report.status || "processing")}
                                  {report.status || "processing"}
                                </span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {getReportTypeDisplay(report.reportType)}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {safeFormatDate(
                                  report.createdAt,
                                  "MMM d, yyyy h:mm a"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {report.status === "completed" && (
                            <Link href={`/reports`}>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`view-report-${report.id}`}
                              >
                                View Report
                              </Button>
                            </Link>
                          )}

                          {report.status === "processing" && (
                            <div className="flex items-center gap-2 text-amber-500">
                              <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium">
                                AI Analyzing...
                              </span>
                            </div>
                          )}

                          {report.status === "failed" && (
                            <span className="text-sm text-red-500">
                              Failed to process
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

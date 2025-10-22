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
        return <CheckCircle className="h-4 w-4 text-green-300" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-amber-300 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-300" />;
      default:
        return <Clock className="h-4 w-4 text-white/60" />;
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
    <div className="min-h-screen futuristic-bg relative overflow-hidden">
      {/* Hero Section with Image Background */}
      <div className="absolute inset-0">
        <img
          src={MEDICAL_IMAGES.upload}
          alt="Medical Document Upload"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Floating Particles Background */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-sky-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse floating-particles"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700 floating-particles"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000 floating-particles"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500 floating-particles"></div>
      </div>

      <div className="relative z-10 space-y-8 page-transition p-6">
        {/* Page Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Upload Medical Documents
          </h1>
          <p className="text-white/90 text-xl drop-shadow-md">
            Upload your medical reports, prescriptions, and lab results for
            AI-powered analysis
          </p>
        </div>

        {/* Upload Options */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="enhanced" className="space-y-8">
            <TabsList className="glass-card backdrop-blur-xl bg-white/10 border-2 border-white/20 grid w-full max-w-md grid-cols-2">
              <TabsTrigger
                value="enhanced"
                data-testid="tab-enhanced"
                className="bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white/20 data-[state=active]:text-white"
              >
                <FileUp className="h-4 w-4 mr-2" />
                With Details
              </TabsTrigger>
              <TabsTrigger
                value="quick"
                data-testid="tab-quick"
                className="bg-white/10 text-white hover:bg-white/20 data-[state=active]:bg-white/20 data-[state=active]:text-white"
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Quick Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced">
              <div className="glass-card backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-2xl p-8">
                <UploadReportForm />
              </div>
            </TabsContent>

            <TabsContent value="quick">
              <div className="glass-card backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-2xl p-8">
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
          <Card className="glass-card backdrop-blur-xl bg-white/10 border-2 border-white/20 shadow-2xl">
            <CardHeader className="border-b border-white/20">
              <CardTitle className="text-2xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center soft-glow">
                  <FileText className="h-5 w-5 text-white drop-shadow-lg" />
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
                      className="flex items-center space-x-4 p-4 glass-card backdrop-blur-sm bg-white/5 border border-white/20 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse ai-analysis-loading" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/20 rounded animate-pulse" />
                        <div className="h-3 bg-white/20 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 soft-glow icon-static">
                    <FileText className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                  <p className="text-white/80 text-lg mb-2 drop-shadow-md">
                    No documents uploaded yet
                  </p>
                  <p className="text-sm text-white/60 drop-shadow-md">
                    Your uploaded documents will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUploads.map((report: Report) => (
                    <div
                      key={report.id}
                      className="glass-card backdrop-blur-sm bg-white/5 border-2 border-white/20 rounded-2xl p-6 hover:shadow-xl hover:border-sky-400/30 smooth-transition modern-card"
                      data-testid={`upload-${report.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center soft-glow">
                            <FileText className="h-6 w-6 text-white drop-shadow-lg" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-white text-lg drop-shadow-md">
                                {report.fileName}
                              </h4>
                              <Badge
                                className={`${getStatusColor(
                                  report.status || "processing"
                                )} backdrop-blur-sm border-white/20`}
                              >
                                <span className="flex items-center gap-2">
                                  {getStatusIcon(report.status || "processing")}
                                  {report.status || "processing"}
                                </span>
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-white/70">
                              <span className="drop-shadow-md">
                                {getReportTypeDisplay(report.reportType)}
                              </span>
                              <span className="flex items-center gap-2 drop-shadow-md">
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
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                              >
                                View Report
                              </Button>
                            </Link>
                          )}

                          {report.status === "processing" && (
                            <div className="flex items-center gap-2 text-amber-400">
                              <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full ai-analysis-loading"></div>
                              <span className="text-sm font-medium drop-shadow-md">
                                AI Analyzing...
                              </span>
                            </div>
                          )}

                          {report.status === "failed" && (
                            <span className="text-sm text-red-400 drop-shadow-md">
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

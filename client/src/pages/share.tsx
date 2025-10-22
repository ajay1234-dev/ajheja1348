import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SharingOptions from "@/components/share/sharing-options";
import { Share2, FileText, Users } from "lucide-react";

export default function Share() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [doctorEmail, setDoctorEmail] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const completedReports = (reports || []).filter(
    (report: any) => report.status === "completed"
  );

  const handleReportSelection = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter((id) => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(completedReports.map((report: any) => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Share with Healthcare Provider
        </h1>
        <p className="text-muted-foreground">
          Generate shareable reports and summaries for your doctor visits
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Available Reports
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {completedReports.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <FileText className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Selected Reports
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  {selectedReports.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Share2 className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 drop-shadow-md">
                  Previous Shares
                </p>
                <p className="text-2xl font-bold text-white drop-shadow-lg">
                  0
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center soft-glow icon-static">
                <Users className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Selection */}
        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardHeader className="border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
            <CardTitle className="text-white drop-shadow-lg">
              Select Reports to Share
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={
                  selectedReports.length === completedReports.length &&
                  completedReports.length > 0
                }
                onCheckedChange={handleSelectAll}
                data-testid="select-all-reports"
              />
              <Label
                htmlFor="select-all"
                className="text-sm text-white/80 drop-shadow-md"
              >
                Select all reports
              </Label>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 border border-border rounded-lg"
                  >
                    <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : completedReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No completed reports available to share
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`report-option-${report.id}`}
                  >
                    <Checkbox
                      id={`report-${report.id}`}
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={(checked) =>
                        handleReportSelection(report.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`report-${report.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {report.fileName}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {report.reportType.replace("_", " ").toUpperCase()} •
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor Information */}
        <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
          <CardHeader className="border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
            <CardTitle className="text-white drop-shadow-lg">
              Healthcare Provider Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="doctor-email">Doctor's Email (Optional)</Label>
              <Input
                id="doctor-email"
                type="email"
                placeholder="doctor@clinic.com"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                data-testid="doctor-email-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If provided, we'll send the report directly to your healthcare
                provider
              </p>
            </div>

            {/* Sharing Options */}
            <div className="pt-4 border-t border-border">
              <SharingOptions
                selectedReports={selectedReports}
                doctorEmail={doctorEmail}
                disabled={selectedReports.length === 0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shares */}
      <Card className="glass-card backdrop-blur-xl bg-white/10 dark:bg-slate-900/20 border-2 border-white/20 dark:border-white/10 shadow-2xl hover:shadow-sky-400/25 modern-card page-transition">
        <CardHeader className="border-b border-white/20 bg-gradient-to-r from-sky-400/10 to-purple-600/10 dark:from-sky-400/20 dark:to-purple-600/20">
          <CardTitle className="text-white drop-shadow-lg">
            Recent Shares
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 soft-glow icon-static">
              <Share2 className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
            <p className="text-white/80 drop-shadow-md">No recent shares</p>
            <p className="text-sm text-white/60 mt-2 drop-shadow-md">
              Your shared reports will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

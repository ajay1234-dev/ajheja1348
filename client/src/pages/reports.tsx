import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ReportCard from "@/components/reports/report-card";
import { Search, Filter } from "lucide-react";
import type { Report } from "@shared/schema";

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const filteredReports = (reports as Report[] || []).filter((report: Report) => {
    const matchesSearch =
      report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || report.reportType === filterType;
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in bg-white dark:bg-slate-900 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Medical Reports
        </h1>
        <p className="text-muted-foreground">
          View and manage your uploaded medical documents and analysis results
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-reports"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                className="w-full md:w-48"
                data-testid="filter-type"
              >
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="blood_test">Blood Test</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="x-ray">X-Ray</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-full md:w-48"
                data-testid="filter-status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm"
            >
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-6">
              <Filter className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Upload your first medical report to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredReports.map((report: Report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, UserIcon, FileText, Pill, Activity, Share2, Clock, TrendingUp, Stethoscope } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";

export default function DoctorDashboard() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedSharedReport, setSelectedSharedReport] = useState<any>(null);
  const { user } = useAuth();

  const { data: patients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/doctor/patients"],
    queryFn: async () => {
      const response = await fetch('/api/doctor/patients', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    },
  });

  const { data: patientData, isLoading: isLoadingPatientData } = useQuery({
    queryKey: ["/api/doctor/patient", selectedPatient?.id, "reports"],
    enabled: !!selectedPatient,
    queryFn: async () => {
      const response = await fetch(`/api/doctor/patient/${selectedPatient.id}/reports`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch patient data');
      return response.json();
    },
  });

  const { data: sharedReports, isLoading: isLoadingShared } = useQuery<any[]>({
    queryKey: ["/api/doctor/shared-reports"],
    queryFn: async () => {
      const response = await fetch('/api/doctor/shared-reports', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch shared reports');
      return response.json();
    },
  });

  const filteredPatients = (patients || []).filter((patient: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            Dr. {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {user?.specialization && (
              <Badge variant="outline" className="text-sm">
                {user.specialization}
              </Badge>
            )}
            View and manage your patients' health records and reports
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients?.length || 0}
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shared Reports</p>
                <p className="text-2xl font-bold text-foreground">
                  {sharedReports?.length || 0}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients at Risk</p>
                <p className="text-2xl font-bold text-foreground">
                  {patients?.filter((p: any) => p.lastReportSummary).length || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="patients" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="patients" data-testid="tab-patients">
            <UserIcon className="h-4 w-4 mr-2" />
            My Patients
          </TabsTrigger>
          <TabsTrigger value="shared" data-testid="tab-shared">
            <Share2 className="h-4 w-4 mr-2" />
            Shared with Me
            {sharedReports && sharedReports.length > 0 && (
              <Badge variant="secondary" className="ml-2">{sharedReports.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-patients"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <Card>
            <CardHeader>
              <CardTitle>Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No patients found matching your search" : "No patients yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPatients.map((patient: any) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedPatient(patient)}
                      data-testid={`patient-card-${patient.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {patient.age && (
                          <p className="text-sm font-medium text-foreground">
                            Age: {patient.age} years
                          </p>
                        )}
                        {patient.lastReportDate && (
                          <p className="text-xs text-muted-foreground">
                            Last Report: {safeFormatDate(patient.lastReportDate, 'MMM dd, yyyy')}
                          </p>
                        )}
                        {patient.detectedSpecialization && (
                          <Badge variant="outline" className="mt-1">
                            {patient.detectedSpecialization}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports Shared with Me</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingShared ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !sharedReports || sharedReports.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No reports shared with you yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    When patients share their reports with your email, they will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedReports.map((share: any) => (
                    <div
                      key={share.id}
                      className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedSharedReport(share)}
                      data-testid={`shared-report-${share.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Share2 className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-foreground">
                              {share.patient ? `${share.patient.firstName} ${share.patient.lastName}` : 'Patient'}
                            </h3>
                            {!share.isActive && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {share.patient?.email}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {share.reports?.length || 0} reports
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Shared {safeFormatDate(share.createdAt, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSharedReport(share);
                        }}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient && `${selectedPatient.firstName} ${selectedPatient.lastName}'s Records`}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingPatientData ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : patientData ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patientData.patient?.email}</p>
                    </div>
                    {patientData.patient?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{patientData.patient.phone}</p>
                      </div>
                    )}
                    {patientData.patient?.dateOfBirth && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">
                          {safeFormatDate(patientData.patient.dateOfBirth, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Referral Details */}
              {(selectedPatient?.symptoms || selectedPatient?.description || selectedPatient?.detectedSpecialization) && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Referral Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedPatient?.detectedSpecialization && (
                      <div>
                        <p className="text-sm text-muted-foreground">AI Detected Specialization</p>
                        <Badge variant="default" className="mt-1">
                          {selectedPatient.detectedSpecialization}
                        </Badge>
                      </div>
                    )}
                    {selectedPatient?.symptoms && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reported Symptoms</p>
                        <p className="font-medium">{selectedPatient.symptoms}</p>
                      </div>
                    )}
                    {selectedPatient?.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Additional Details</p>
                        <p className="text-sm">{selectedPatient.description}</p>
                      </div>
                    )}
                    {selectedPatient?.lastReportSummary && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Report Summary</p>
                        <p className="text-sm">{selectedPatient.lastReportSummary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medical Reports ({patientData.reports?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.reports?.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">{report.fileName}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Type: {report.reportType.replace('_', ' ')}
                              </p>
                              {report.summary && (
                                <p className="text-sm">{report.summary}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {safeFormatDate(report.createdAt, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reports available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Medications ({patientData.medications?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.medications?.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.medications.map((med: any) => (
                        <div key={med.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Pill className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1">
                              <h4 className="font-semibold">{med.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} - {med.frequency}
                              </p>
                              {med.instructions && (
                                <p className="text-sm mt-1">{med.instructions}</p>
                              )}
                              {med.isActive && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No medications recorded
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Health Timeline Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Health Timeline</CardTitle>
                    <Button
                      onClick={() => {
                        setSelectedPatient(null);
                        navigate(`/doctor/patient/${patientData.patient.id}/timeline`);
                      }}
                      variant="outline"
                      size="sm"
                      data-testid="view-full-timeline"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Full Timeline
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {patientData.timeline?.length > 0 ? (
                    <div className="space-y-3">
                      {patientData.timeline.slice(0, 5).map((event: any) => (
                        <div key={event.id} className="border-l-2 border-primary pl-4">
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {safeFormatDate(event.date, 'MMM dd, yyyy')}
                          </p>
                          {event.description && (
                            <p className="text-sm mt-1">{event.description}</p>
                          )}
                        </div>
                      ))}
                      {patientData.timeline.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          And {patientData.timeline.length - 5} more events...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No timeline events yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Timeline events will appear as the patient uploads reports or adds health data
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Shared Report Details Dialog */}
      <Dialog open={!!selectedSharedReport} onOpenChange={() => setSelectedSharedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSharedReport && selectedSharedReport.patient && 
                `${selectedSharedReport.patient.firstName} ${selectedSharedReport.patient.lastName}'s Shared Reports`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSharedReport && (
            <div className="space-y-6">
              {/* Share Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Patient Email</p>
                      <p className="font-medium">{selectedSharedReport.patient?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shared On</p>
                      <p className="font-medium">
                        {safeFormatDate(selectedSharedReport.createdAt, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expires On</p>
                      <p className="font-medium">
                        {safeFormatDate(selectedSharedReport.expiresAt, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={selectedSharedReport.isActive ? "default" : "destructive"}>
                        {selectedSharedReport.isActive ? "Active" : "Expired"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Details for Shared Report */}
              {(selectedSharedReport.symptoms || selectedSharedReport.description || selectedSharedReport.detectedSpecialization) && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Referral Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSharedReport.detectedSpecialization && (
                      <div>
                        <p className="text-sm text-muted-foreground">AI Detected Specialization</p>
                        <Badge variant="default" className="mt-1">
                          {selectedSharedReport.detectedSpecialization}
                        </Badge>
                      </div>
                    )}
                    {selectedSharedReport.symptoms && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reported Symptoms</p>
                        <p className="font-medium">{selectedSharedReport.symptoms}</p>
                      </div>
                    )}
                    {selectedSharedReport.description && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Additional Details</p>
                        <p className="text-sm">{selectedSharedReport.description}</p>
                      </div>
                    )}
                    {selectedSharedReport.reportSummary && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Report Summary</p>
                        <p className="text-sm">{selectedSharedReport.reportSummary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Shared Reports */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shared Medical Reports ({selectedSharedReport.reports?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSharedReport.reports?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSharedReport.reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">{report.fileName}</h4>
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(report.status)}`}>
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Type: {report.reportType.replace('_', ' ')}
                              </p>
                              {report.summary && (
                                <p className="text-sm">{report.summary}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {safeFormatDate(report.createdAt, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reports in this share
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

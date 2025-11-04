import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserIcon, FileText, ArrowLeft } from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";

interface AssignedDoctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  profilePictureUrl?: string | null;
  assignedDate?: any;
  detectedSpecialization?: string;
  reportSummary?: string;
  approvalStatus?: string;
  treatmentStatus?: string;
}

export default function DoctorDetails() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState<AssignedDoctor | null>(null);

  const { data: assignedDoctors, isLoading } = useQuery<AssignedDoctor[]>({
    queryKey: ["/api/patient/doctors"],
  });

  useEffect(() => {
    if (assignedDoctors && id) {
      const foundDoctor = assignedDoctors.find(doc => doc.id === id);
      if (foundDoctor) {
        setDoctor(foundDoctor);
      }
    }
  }, [assignedDoctors, id]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading doctor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-xl font-semibold">Doctor not found</p>
            <Link href="/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {doctor.profilePictureUrl ? (
          <img
            src={doctor.profilePictureUrl}
            alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <UserIcon className="h-12 w-12 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">
            Dr. {doctor.firstName} {doctor.lastName}
          </h1>
          {doctor.specialization && (
            <Badge className="mt-2 text-lg py-1 px-3">{doctor.specialization}</Badge>
          )}
        </div>
      </div>

      {/* Doctor Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Doctor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{doctor.email}</p>
            </div>
            {doctor.specialization && (
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{doctor.specialization}</p>
              </div>
            )}
            {doctor.assignedDate && (
              <div>
                <p className="text-sm text-muted-foreground">Assigned Date</p>
                <p className="font-medium">
                  {safeFormatDate(doctor.assignedDate, "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {doctor.approvalStatus && (
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`${
                  doctor.approvalStatus === "pending" 
                    ? "bg-amber-500" 
                    : doctor.treatmentStatus === "completed"
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}>
                  {doctor.approvalStatus === "pending" 
                    ? "Pending Approval" 
                    : doctor.treatmentStatus === "completed"
                    ? "Treatment Completed"
                    : "Active Treatment"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Details */}
      {doctor.detectedSpecialization && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Referral Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctor.detectedSpecialization && (
              <div>
                <p className="text-sm text-muted-foreground">AI Detected Specialization</p>
                <Badge variant="default" className="mt-1">
                  {doctor.detectedSpecialization}
                </Badge>
              </div>
            )}
            {doctor.reportSummary && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Report Summary</p>
                <p className="text-sm">{doctor.reportSummary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {doctor.approvalStatus === "pending" && (
        <div className="mt-6 flex justify-end">
          <Link href="/doctor-approval">
            <Button>
              Go to Doctor Approval
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  profilePictureUrl?: string;
}

interface Report {
  id: string;
  fileName: string;
  status: string;
  reportType: string;
  createdAt: string;
  fileUrl: string;
}

interface SharedReport {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  reportId: string;
  reportName: string;
  reportURL: string;
  timestamp: number;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl?: string;
  };
}

interface ShareReportData {
  patientId: string;
  doctorId: string;
  reportId: string;
  reportName: string;
  reportURL: string;
}

export const useMappedDoctor = () => {
  return useQuery<Doctor[]>({
    queryKey: ["/api/patient/mapped-doctor"],
    queryFn: async () => {
      const response = await fetch("/api/patient/mapped-doctor", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No mapped doctor found
        }
        throw new Error("Failed to fetch mapped doctor");
      }
      const doctor = await response.json();
      // Return as array to match the expected type
      return Array.isArray(doctor) ? doctor : [doctor];
    },
  });
};

export const usePatientReports = () => {
  return useQuery<Report[]>({
    queryKey: ["/api/patient/reports"],
    queryFn: async () => {
      const response = await fetch("/api/patient/reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
  });
};

export const useShareReportWithDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ShareReportData) => {
      const response = await apiRequest("POST", "/api/share-report", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/patient/reports"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/patient/mapped-doctor"],
      });
    },
  });
};

export const useDoctorSharedReports = () => {
  return useQuery<SharedReport[]>({
    queryKey: ["/api/doctor/shared-reports"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/shared-reports", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch shared reports");
      return response.json();
    },
  });
};

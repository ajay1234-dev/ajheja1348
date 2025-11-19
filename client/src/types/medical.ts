export interface MedicalAnalysis {
  keyFindings: Array<{
    parameter: string;
    value: string;
    normalRange: string;
    status: "normal" | "abnormal" | "borderline";
    explanation: string;
  }>;
  summary: string;
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
  nextSteps: string[];
  diagnosis?: string; // Added for TimelineEvent
}

export interface DashboardStats {
  totalReports: number;
  activeMedications: number;
  pendingReminders: number;
  healthScore: string;
}

// Medical data types for the healthcare application

export interface TimelineEvent {
  id: string; // Added
  title: string; // Added
  date: string;
  metrics: Record<string, number | string>;
  reportName: string;
  prescriptions?: string[];
  eventType?: string;
  description?: string; // Added
  summary?: string; // Added
  analysis?: MedicalAnalysis; // Added
  medications?: Array<{ // Added
    name: string;
    status?: string;
    endDate?: string;
    isActive?: boolean;
    frequency?: string;
    dosage?: string;
    duration?: string;
    instructions?: string;
    sideEffects?: string[] | string;
  }>;
  doctorInfo?: { // Added
    name: string;
    specialization?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    notes?: string;
    nextConsultation?: string;
  };
  riskLevel?: string; // Added
  severityLevel?: string; // Added
  fileUrl?: string; // Added
  reportId?: string; // Added
  comparisonData?: string | { trend: string; notes: string }; // Added
  reportType?: string; // Added
  notes?: string; // Added for direct usage
}

export interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface FilterCategory {
  id: string;
  name: string;
  metrics: string[];
}

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  nextDose: string;
  taken: boolean;
}
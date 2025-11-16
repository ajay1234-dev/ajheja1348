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
}

export interface DashboardStats {
  totalReports: number;
  activeMedications: number;
  pendingReminders: number;
  healthScore: string;
}

// Medical data types for the healthcare application

export interface TimelineEvent {
  date: string;
  metrics: Record<string, number | string>;
  reportName: string;
  prescriptions?: string[];
  eventType?: string;
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

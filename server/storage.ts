import { 
  type User, 
  type InsertUser, 
  type Report, 
  type InsertReport,
  type Medication,
  type InsertMedication,
  type Reminder,
  type InsertReminder,
  type HealthTimeline,
  type InsertHealthTimeline,
  type DoctorConsultation,
  type InsertDoctorConsultation,
  type HealthProgress,
  type InsertHealthProgress,
  type SharedReport,
  type InsertSharedReport
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllPatients(): Promise<User[]>;
  getAllDoctors(): Promise<User[]>;
  getDoctorsBySpecialization(specialization: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Reports
  getReport(id: string): Promise<Report | undefined>;
  getUserReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;

  // Medications
  getMedication(id: string): Promise<Medication | undefined>;
  getUserMedications(userId: string): Promise<Medication[]>;
  getActiveMedications(userId: string): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<boolean>;

  // Reminders
  getReminder(id: string): Promise<Reminder | undefined>;
  getUserReminders(userId: string): Promise<Reminder[]>;
  getActiveReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined>;

  // Doctor Consultations
  getDoctorConsultation(id: string): Promise<DoctorConsultation | undefined>;
  getUserDoctorConsultations(userId: string): Promise<DoctorConsultation[]>;
  createDoctorConsultation(consultation: InsertDoctorConsultation): Promise<DoctorConsultation>;

  // Health Progress
  getUserHealthProgress(userId: string): Promise<HealthProgress[]>;
  createHealthProgress(progress: InsertHealthProgress): Promise<HealthProgress>;

  // Health Timeline
  getUserHealthTimeline(userId: string): Promise<HealthTimeline[]>;
  createHealthTimelineEntry(entry: InsertHealthTimeline): Promise<HealthTimeline>;

  // Shared Reports
  getSharedReport(token: string): Promise<SharedReport | undefined>;
  getSharedReportById(id: string): Promise<SharedReport | undefined>;
  getSharedReportsByDoctorEmail(email: string): Promise<SharedReport[]>;
  getSharedReportsByPatientId(patientId: string): Promise<SharedReport[]>;
  createSharedReport(sharedReport: InsertSharedReport): Promise<SharedReport>;
  updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined>;
}

// Use Firebase Firestore for persistent storage
import { FirestoreStorage } from "./firestore-storage";
const storage: IStorage = new FirestoreStorage();
console.log('✅ Using Firebase Firestore for data persistence');

export { storage };

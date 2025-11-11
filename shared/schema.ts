import { z } from "zod";
// Add Drizzle table definitions for DatabaseStorage compatibility
import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// User Schema
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["patient", "doctor"]).default("patient"),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  authProvider: z.enum(["email", "google"]).default("email").optional(),
  firebaseUid: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  age: z.number().optional().nullable(),
  gender: z.string().optional().nullable(),
  profilePictureUrl: z.string().optional().nullable(),
});

export const userSchema = insertUserSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
});

// Report Schema
export const insertReportSchema = z.object({
  userId: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  reportType: z.string(),
  originalText: z.string().optional().nullable(),
  extractedData: z.any().optional().nullable(),
  analysis: z.any().optional().nullable(),
  summary: z.string().optional().nullable(),
  status: z
    .enum(["processing", "completed", "failed"])
    .default("processing")
    .optional(),
  uploadedAt: z.date().or(z.any()).optional(),
});

export const reportSchema = insertReportSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
});

// Medication Schema
export const insertMedicationSchema = z.object({
  userId: z.string(),
  reportId: z.string().optional().nullable(),
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  sideEffects: z.string().optional().nullable(),
  isActive: z.boolean().default(true).optional(),
  prescribedBy: z.string().optional().nullable(),
  doctorSpecialization: z.string().optional().nullable(),
  prescriptionDate: z.date().or(z.any()).optional().nullable(),
  startDate: z.date().or(z.any()).optional().nullable(),
  endDate: z.date().or(z.any()).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z
    .enum(["active", "completed", "expired"])
    .default("active")
    .optional(),
});

export const medicationSchema = insertMedicationSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
});

// Reminder Schema
export const insertReminderSchema = z.object({
  userId: z.string(),
  medicationId: z.string().optional().nullable(),
  type: z.enum(["medication", "appointment", "refill"]),
  title: z.string(),
  message: z.string().optional().nullable(),
  scheduledTime: z.date().or(z.any()),
  isCompleted: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const reminderSchema = insertReminderSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
});

// Doctor Consultation Schema
export const insertDoctorConsultationSchema = z.object({
  userId: z.string(),
  reportId: z.string().optional().nullable(),
  doctorName: z.string(),
  doctorSpecialization: z.string().optional().nullable(),
  consultationDate: z.date().or(z.any()),
  diagnosis: z.string().optional().nullable(),
  treatmentPlan: z.string().optional().nullable(),
  prescriptions: z.any().optional().nullable(),
  nextConsultationDate: z.date().or(z.any()).optional().nullable(),
  doctorNotes: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export const doctorConsultationSchema = insertDoctorConsultationSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
  updatedAt: z.date().or(z.any()),
});

// Health Timeline Schema
export const insertHealthTimelineSchema = z.object({
  userId: z.string(),
  reportId: z.string().optional().nullable(),
  consultationId: z.string().optional().nullable(),
  date: z.date().or(z.any()),
  eventType: z.string(),
  reportType: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  analysis: z.any().optional().nullable(),
  medications: z.any().optional().nullable(),
  metrics: z.any().optional().nullable(),
  severityLevel: z.string().optional().nullable(),
  riskLevel: z.string().optional().nullable(),
  comparisonData: z.any().optional().nullable(),
  doctorInfo: z.any().optional().nullable(),
  notes: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export const healthTimelineSchema = insertHealthTimelineSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
});

// Health Progress Schema
export const insertHealthProgressSchema = z.object({
  userId: z.string(),
  recordDate: z.date().or(z.any()),
  bloodPressure: z.string().optional().nullable(),
  heartRate: z.number().optional().nullable(),
  bloodSugar: z.number().optional().nullable(),
  weight: z.string().optional().nullable(),
  temperature: z.string().optional().nullable(),
  oxygenLevel: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const healthProgressSchema = insertHealthProgressSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
});

// Shared Report Schema
export const insertSharedReportSchema = z.object({
  userId: z.string(),
  reportIds: z.array(z.string()).optional().nullable(),
  shareToken: z.string(),
  doctorEmail: z.string().optional().nullable(),
  expiresAt: z.date().or(z.any()),
  isActive: z.boolean().default(true).optional(),
  viewCount: z.number().default(0).optional(),
  patientId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  reportId: z.string().optional().nullable(),
  reportURL: z.string().optional().nullable(),
  detectedSpecialization: z.string().optional().nullable(),
  reportSummary: z.string().optional().nullable(),
  symptoms: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  approvalStatus: z
    .enum(["pending", "approved", "rejected"])
    .default("pending")
    .optional(),
  treatmentStatus: z
    .enum(["active", "completed", "discontinued"])
    .default("active")
    .optional(),
  hideFromDashboard: z.boolean().default(false).optional(),
});

export const sharedReportSchema = insertSharedReportSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = z.infer<typeof reportSchema>;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
export type InsertDoctorConsultation = z.infer<
  typeof insertDoctorConsultationSchema
>;
export type DoctorConsultation = z.infer<typeof doctorConsultationSchema>;
export type InsertHealthTimeline = z.infer<typeof insertHealthTimelineSchema>;
export type HealthTimeline = z.infer<typeof healthTimelineSchema>;
export type InsertHealthProgress = z.infer<typeof insertHealthProgressSchema>;
export type HealthProgress = z.infer<typeof healthProgressSchema>;

// Notification Schema
export const insertNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    "doctor_assignment",
    "patient_approval",
    "doctor_approval",
    "medication",
    "appointment",
    "report",
  ]),
  title: z.string(),
  message: z.string(),
  relatedId: z.string().optional().nullable(), // sharedReportId, reportId, etc.
  relatedType: z
    .enum(["shared_report", "report", "medication", "appointment"])
    .optional()
    .nullable(),
  isRead: z.boolean().default(false).optional(),
  actionUrl: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export const notificationSchema = insertNotificationSchema.extend({
  id: z.string(),
  createdAt: z.date().or(z.any()),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type InsertSharedReport = z.infer<typeof insertSharedReportSchema>;
export type SharedReport = z.infer<typeof sharedReportSchema>;

// Health Summary Schema
export const healthSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  reportIds: z.array(z.string()).optional().nullable(),
  summaryText: z.string(),
  healthScore: z.string(),
  recommendations: z.array(z.string()),
  medications: z.array(z.string()),
  createdAt: z.date().or(z.any()),
});

export type HealthSummary = z.infer<typeof healthSummarySchema>;

// Prescription Schema
export const prescriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  doctorId: z.string().optional().nullable(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      duration: z.string().optional().nullable(),
      instructions: z.string().optional().nullable(),
      prescribedDate: z.date().or(z.any()),
    })
  ),
  notes: z.string().optional().nullable(),
  validityPeriod: z.date().or(z.any()),
  createdAt: z.date().or(z.any()),
});

export type Prescription = z.infer<typeof prescriptionSchema>;

// Drizzle table definitions (map camelCase properties to snake_case columns)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  language: text("language"),
  authProvider: text("auth_provider"),
  firebaseUid: text("firebase_uid"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  reportType: text("report_type").notNull(),
  originalText: text("original_text"),
  extractedData: jsonb("extracted_data"),
  summary: text("summary"),
  status: text("status"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const medications = pgTable("medications", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  reportId: varchar("report_id"),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  instructions: text("instructions"),
  sideEffects: text("side_effects"),
  isActive: boolean("is_active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  medicationId: varchar("medication_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  isCompleted: boolean("is_completed"),
  isActive: boolean("is_active"),
  createdAt: timestamp("created_at"),
});

export const healthTimeline = pgTable("health_timeline", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  reportId: varchar("report_id"),
  date: timestamp("date").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metrics: jsonb("metrics"),
  notes: text("notes"),
  createdAt: timestamp("created_at"),
});

export const sharedReports = pgTable("shared_reports", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  reportIds: text("report_ids"),
  shareToken: text("share_token").notNull(),
  doctorEmail: text("doctor_email"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active"),
  viewCount: integer("view_count"),
  createdAt: timestamp("created_at"),
});

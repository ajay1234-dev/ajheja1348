import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import {
  users as usersSchema,
  reports as reportsSchema,
  medications as medicationsSchema,
  reminders as remindersSchema,
  healthTimeline as healthTimelineSchema,
  sharedReports as sharedReportsSchema,
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
  type SharedReport,
  type InsertSharedReport,
} from '@shared/schema';
import type { IStorage } from './storage';

// Remove interface implementation since this class isn't used in production
export class DatabaseStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(usersSchema).where(eq(usersSchema.email, email)).limit(1);
    return result[0];
  }

  async getAllPatients(): Promise<User[]> {
    return await db.select().from(usersSchema).where(eq(usersSchema.role, 'patient'));
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(usersSchema).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(usersSchema).set(updates).where(eq(usersSchema.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<number> {
    const result = await db.delete(usersSchema).where(eq(usersSchema.id, id)).returning();
    return result.length;
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reportsSchema).where(eq(reportsSchema.id, id)).limit(1);
    return result[0];
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return await db.select().from(reportsSchema).where(eq(reportsSchema.userId, userId)).orderBy(desc(reportsSchema.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reportsSchema).values(report).returning();
    return result[0];
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const result = await db.update(reportsSchema).set(updates).where(eq(reportsSchema.id, id)).returning();
    return result[0];
  }

  async deleteReport(id: string): Promise<number> {
    const result = await db.delete(reportsSchema).where(eq(reportsSchema.id, id)).returning();
    return result.length;
  }

  // Medications
  async getMedication(id: string): Promise<Medication | undefined> {
    const result = await db.select().from(medicationsSchema).where(eq(medicationsSchema.id, id)).limit(1);
    return result[0];
  }

  async getUserMedications(userId: string): Promise<Medication[]> {
    return await db.select().from(medicationsSchema).where(eq(medicationsSchema.userId, userId)).orderBy(desc(medicationsSchema.createdAt));
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    return await db.select().from(medicationsSchema).where(
      and(eq(medicationsSchema.userId, userId), eq(medicationsSchema.isActive, true))
    ).orderBy(desc(medicationsSchema.createdAt));
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medicationsSchema).values(medication).returning();
    return result[0];
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined> {
    const result = await db.update(medicationsSchema).set(updates).where(eq(medicationsSchema.id, id)).returning();
    return result[0];
  }

  async deleteMedication(id: string): Promise<number> {
    const result = await db.delete(medicationsSchema).where(eq(medicationsSchema.id, id)).returning();
    return result.length;
  }

  // Reminders
  async getReminder(id: string): Promise<Reminder | undefined> {
    const result = await db.select().from(remindersSchema).where(eq(remindersSchema.id, id)).limit(1);
    return result[0];
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return await db.select().from(remindersSchema).where(eq(remindersSchema.userId, userId)).orderBy(desc(remindersSchema.createdAt));
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(remindersSchema).values(reminder).returning();
    return result[0];
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const result = await db.update(remindersSchema).set(updates).where(eq(remindersSchema.id, id)).returning();
    return result[0];
  }

  async deleteReminder(id: string): Promise<number> {
    const result = await db.delete(remindersSchema).where(eq(remindersSchema.id, id)).returning();
    return result.length;
  }

  // Health Timeline
  async getHealthTimelineEntry(id: string): Promise<HealthTimeline | undefined> {
    const result = await db.select().from(healthTimelineSchema).where(eq(healthTimelineSchema.id, id)).limit(1);
    return result[0];
  }

  async getHealthTimelineByUser(userId: string): Promise<HealthTimeline[]> {
    return await db.select().from(healthTimelineSchema).where(eq(healthTimelineSchema.userId, userId)).orderBy(desc(healthTimelineSchema.date));
  }

  async createHealthTimelineEntry(entry: InsertHealthTimeline): Promise<HealthTimeline> {
    const result = await db.insert(healthTimelineSchema).values(entry).returning();
    return result[0];
  }

  async updateHealthTimelineEntry(id: string, entry: Partial<InsertHealthTimeline>): Promise<HealthTimeline> {
    const result = await db.update(healthTimelineSchema).set(entry).where(eq(healthTimelineSchema.id, id)).returning();
    return result[0];
  }

  async deleteHealthTimelineEntry(id: string): Promise<number> {
    const result = await db.delete(healthTimelineSchema).where(eq(healthTimelineSchema.id, id)).returning();
    return result.length;
  }

  // Shared Reports
  async getSharedReport(id: string): Promise<SharedReport | undefined> {
    const result = await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.id, id)).limit(1);
    return result[0];
  }

  async getSharedReportsByUser(userId: string): Promise<SharedReport[]> {
    return await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.userId, userId)).orderBy(desc(sharedReportsSchema.createdAt));
  }

  async getSharedReportsByDoctorEmail(email: string): Promise<SharedReport[]> {
    return await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.doctorEmail, email)).orderBy(desc(sharedReportsSchema.createdAt));
  }

  async createSharedReport(sharedReport: InsertSharedReport): Promise<SharedReport> {
    const result = await db.insert(sharedReportsSchema).values(sharedReport).returning();
    return result[0];
  }

  async updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined> {
    const result = await db.update(sharedReportsSchema).set(updates).where(eq(sharedReportsSchema.id, id)).returning();
    return result[0];
  }

  async deleteSharedReport(id: string): Promise<number> {
    const result = await db.delete(sharedReportsSchema).where(eq(sharedReportsSchema.id, id)).returning();
    return result.length;
  }

  async deleteAllMedicationsForUser(userId: string): Promise<number> {
    const result = await db.delete(medicationsSchema).where(eq(medicationsSchema.userId, userId)).returning();
    return result.length;
  }

  async deleteAllRemindersForUser(userId: string): Promise<number> {
    const result = await db.delete(remindersSchema).where(eq(remindersSchema.userId, userId)).returning();
    return result.length;
  }

  async deleteAllReportsForUser(userId: string): Promise<number> {
    const result = await db.delete(reportsSchema).where(eq(reportsSchema.userId, userId)).returning();
    return result.length;
  }

  async deleteAllHealthTimelineEntriesForUser(userId: string): Promise<number> {
    const result = await db.delete(healthTimelineSchema).where(eq(healthTimelineSchema.userId, userId)).returning();
    return result.length;
  }

  async deleteAllSharedReportsForUser(userId: string): Promise<number> {
    const result = await db.delete(sharedReportsSchema).where(eq(sharedReportsSchema.userId, userId)).returning();
    return result.length;
  }
}
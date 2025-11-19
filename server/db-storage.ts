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

// Remove interface implementation since this class isn't used in production
export class DatabaseStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1);
    return result[0] as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(usersSchema).where(eq(usersSchema.email, email)).limit(1);
    return result[0] as User | undefined;
  }

  async getAllPatients(): Promise<User[]> {
    const results = await db.select().from(usersSchema).where(eq(usersSchema.role, 'patient'));
    return results as User[];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(usersSchema).values(user as typeof usersSchema.$inferInsert).returning();
    return result[0] as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(usersSchema).set(updates as Partial<typeof usersSchema.$inferInsert>).where(eq(usersSchema.id, id)).returning();
    return result[0] as User | undefined;
  }

  async deleteUser(id: string): Promise<number> {
    const result = await db.delete(usersSchema).where(eq(usersSchema.id, id)).returning();
    return result.length;
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reportsSchema).where(eq(reportsSchema.id, id)).limit(1);
    return result[0] as Report | undefined;
  }

  async getUserReports(userId: string): Promise<Report[]> {
    const results = await db.select().from(reportsSchema).where(eq(reportsSchema.userId, userId)).orderBy(desc(reportsSchema.createdAt));
    return results as Report[];
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reportsSchema).values(report as typeof reportsSchema.$inferInsert).returning();
    return result[0] as Report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const result = await db.update(reportsSchema).set(updates as Partial<typeof reportsSchema.$inferInsert>).where(eq(reportsSchema.id, id)).returning();
    return result[0] as Report | undefined;
  }

  async deleteReport(id: string): Promise<number> {
    const result = await db.delete(reportsSchema).where(eq(reportsSchema.id, id)).returning();
    return result.length;
  }

  // Medications
  async getMedication(id: string): Promise<Medication | undefined> {
    const result = await db.select().from(medicationsSchema).where(eq(medicationsSchema.id, id)).limit(1);
    return result[0] as Medication | undefined;
  }

  async getUserMedications(userId: string): Promise<Medication[]> {
    const results = await db.select().from(medicationsSchema).where(eq(medicationsSchema.userId, userId)).orderBy(desc(medicationsSchema.createdAt));
    return results as Medication[];
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    const results = await db.select().from(medicationsSchema).where(
      and(eq(medicationsSchema.userId, userId), eq(medicationsSchema.isActive, true))
    ).orderBy(desc(medicationsSchema.createdAt));
    return results as Medication[];
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medicationsSchema).values(medication as typeof medicationsSchema.$inferInsert).returning();
    return result[0] as Medication;
  }

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication | undefined> {
    const result = await db.update(medicationsSchema).set(updates as Partial<typeof medicationsSchema.$inferInsert>).where(eq(medicationsSchema.id, id)).returning();
    return result[0] as Medication | undefined;
  }

  async deleteMedication(id: string): Promise<number> {
    const result = await db.delete(medicationsSchema).where(eq(medicationsSchema.id, id)).returning();
    return result.length;
  }

  // Reminders
  async getReminder(id: string): Promise<Reminder | undefined> {
    const result = await db.select().from(remindersSchema).where(eq(remindersSchema.id, id)).limit(1);
    return result[0] as Reminder | undefined;
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    const results = await db.select().from(remindersSchema).where(eq(remindersSchema.userId, userId)).orderBy(desc(remindersSchema.createdAt));
    return results as Reminder[];
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(remindersSchema).values(reminder as typeof remindersSchema.$inferInsert).returning();
    return result[0] as Reminder;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const result = await db.update(remindersSchema).set(updates as Partial<typeof remindersSchema.$inferInsert>).where(eq(remindersSchema.id, id)).returning();
    return result[0] as Reminder | undefined;
  }

  async deleteReminder(id: string): Promise<number> {
    const result = await db.delete(remindersSchema).where(eq(remindersSchema.id, id)).returning();
    return result.length;
  }

  // Health Timeline
  async getHealthTimelineEntry(id: string): Promise<HealthTimeline | undefined> {
    const result = await db.select().from(healthTimelineSchema).where(eq(healthTimelineSchema.id, id)).limit(1);
    return result[0] as HealthTimeline | undefined;
  }

  async getHealthTimelineByUser(userId: string): Promise<HealthTimeline[]> {
    const results = await db.select().from(healthTimelineSchema).where(eq(healthTimelineSchema.userId, userId)).orderBy(desc(healthTimelineSchema.date));
    return results as HealthTimeline[];
  }

  async createHealthTimelineEntry(entry: InsertHealthTimeline): Promise<HealthTimeline> {
    const result = await db.insert(healthTimelineSchema).values(entry as typeof healthTimelineSchema.$inferInsert).returning();
    return result[0] as HealthTimeline;
  }

  async updateHealthTimelineEntry(id: string, entry: Partial<InsertHealthTimeline>): Promise<HealthTimeline> {
    const result = await db.update(healthTimelineSchema).set(entry as Partial<typeof healthTimelineSchema.$inferInsert>).where(eq(healthTimelineSchema.id, id)).returning();
    return result[0] as HealthTimeline;
  }

  async deleteHealthTimelineEntry(id: string): Promise<number> {
    const result = await db.delete(healthTimelineSchema).where(eq(healthTimelineSchema.id, id)).returning();
    return result.length;
  }

  // Shared Reports
  async getSharedReport(id: string): Promise<SharedReport | undefined> {
    const result = await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.id, id)).limit(1);
    return result[0] as SharedReport | undefined;
  }

  async getSharedReportsByUser(userId: string): Promise<SharedReport[]> {
    const results = await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.userId, userId)).orderBy(desc(sharedReportsSchema.createdAt));
    return results as SharedReport[];
  }

  async getSharedReportsByDoctorEmail(email: string): Promise<SharedReport[]> {
    const results = await db.select().from(sharedReportsSchema).where(eq(sharedReportsSchema.doctorEmail, email)).orderBy(desc(sharedReportsSchema.createdAt));
    return results as SharedReport[];
  }

  async createSharedReport(sharedReport: InsertSharedReport): Promise<SharedReport> {
    const result = await db.insert(sharedReportsSchema).values(sharedReport as typeof sharedReportsSchema.$inferInsert).returning();
    return result[0] as SharedReport;
  }

  async updateSharedReport(id: string, updates: Partial<SharedReport>): Promise<SharedReport | undefined> {
    const result = await db.update(sharedReportsSchema).set(updates as Partial<typeof sharedReportsSchema.$inferInsert>).where(eq(sharedReportsSchema.id, id)).returning();
    return result[0] as SharedReport | undefined;
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
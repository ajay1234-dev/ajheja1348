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
  type InsertSharedReport,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { firestore } from "./firebase-admin";
import type { IStorage } from "./storage";

export class FirestoreStorage implements IStorage {
  private getCollection(role?: string) {
    if (!firestore) {
      throw new Error("Firestore is not initialized");
    }

    if (role === "doctor") {
      return firestore.collection("doctors");
    } else if (role === "patient") {
      return firestore.collection("patients");
    }

    return firestore.collection("users");
  }

  private async getUserFromBothCollections(
    email: string
  ): Promise<{ user: User; collection: string } | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const patientDoc = await firestore
      .collection("patients")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!patientDoc.empty) {
      const data = patientDoc.docs[0].data();
      return {
        user: { id: patientDoc.docs[0].id, ...data } as User,
        collection: "patients",
      };
    }

    const doctorDoc = await firestore
      .collection("doctors")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!doctorDoc.empty) {
      const data = doctorDoc.docs[0].data();
      return {
        user: { id: doctorDoc.docs[0].id, ...data } as User,
        collection: "doctors",
      };
    }

    return undefined;
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const patientDoc = await firestore.collection("patients").doc(id).get();
    if (patientDoc.exists) {
      return { id: patientDoc.id, ...patientDoc.data() } as User;
    }

    const doctorDoc = await firestore.collection("doctors").doc(id).get();
    if (doctorDoc.exists) {
      return { id: doctorDoc.id, ...doctorDoc.data() } as User;
    }

    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.getUserFromBothCollections(email);
    return result?.user;
  }

  async getAllPatients(): Promise<User[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore.collection("patients").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

  async getAllDoctors(): Promise<User[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore.collection("doctors").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

  async getDoctorsBySpecialization(specialization: string): Promise<User[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("doctors")
      .where("specialization", "==", specialization)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const role = insertUser.role || "patient";
    const collection = this.getCollection(role);

    const now = new Date();

    // Build the document data, only including fields that have values
    const docData: any = {
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: role,
      createdAt: now,
      updatedAt: now,
    };

    // Only add optional fields if they have values
    if (insertUser.password) {
      docData.password = insertUser.password;
    }
    if (insertUser.dateOfBirth) {
      docData.dateOfBirth = insertUser.dateOfBirth;
    }
    if (insertUser.phone) {
      docData.phone = insertUser.phone;
    }
    if (insertUser.language) {
      docData.language = insertUser.language;
    }
    if (insertUser.authProvider) {
      docData.authProvider = insertUser.authProvider;
    }
    if (insertUser.firebaseUid) {
      docData.firebaseUid = insertUser.firebaseUid;
    }
    if (insertUser.specialization) {
      docData.specialization = insertUser.specialization;
    }
    if (insertUser.age !== undefined && insertUser.age !== null) {
      docData.age = insertUser.age;
    }
    if (insertUser.gender) {
      docData.gender = insertUser.gender;
    }
    if (insertUser.profilePictureUrl) {
      docData.profilePictureUrl = insertUser.profilePictureUrl;
    }

    await collection.doc(id).set(docData);

    // Build the user object to return
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password || null,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: role,
      dateOfBirth: insertUser.dateOfBirth || null,
      phone: insertUser.phone || null,
      language: insertUser.language || null,
      authProvider: insertUser.authProvider || undefined,
      firebaseUid: insertUser.firebaseUid || null,
      specialization: insertUser.specialization || null,
      age: insertUser.age || null,
      gender: insertUser.gender || null,
      profilePictureUrl: insertUser.profilePictureUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const user = await this.getUser(id);
    if (!user) return undefined;

    const collection = this.getCollection(user.role);
    const updatedData = { ...updates, updatedAt: new Date() };

    await collection.doc(id).update(updatedData);

    return { ...user, ...updatedData };
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!firestore) throw new Error("Firestore is not initialized");

    try {
      const user = await this.getUser(id);
      if (!user) return false;

      const collection = this.getCollection(user.role);

      // Delete all related data
      // 1. Delete all reports
      const reports = await this.getUserReports(id);
      await Promise.all(reports.map((report) => this.deleteReport(report.id)));

      // 2. Delete all medications
      const medications = await this.getUserMedications(id);
      await Promise.all(
        medications.map((med) => this.deleteMedication(med.id))
      );

      // 3. Delete all reminders
      const reminders = await firestore
        .collection("reminders")
        .where("userId", "==", id)
        .get();
      await Promise.all(reminders.docs.map((doc) => doc.ref.delete()));

      // 4. Delete all shared reports
      const sharedReports = await this.getSharedReportsByPatientId(id);
      await Promise.all(
        sharedReports.map(async (sr) => {
          if (!firestore) return;
          await firestore.collection("sharedReports").doc(sr.id).delete();
        })
      );

      // 5. Delete all health timeline entries
      const timeline = await firestore
        .collection("healthTimeline")
        .where("userId", "==", id)
        .get();
      await Promise.all(timeline.docs.map((doc) => doc.ref.delete()));

      // 6. Delete all health progress entries
      const progress = await firestore
        .collection("healthProgress")
        .where("userId", "==", id)
        .get();
      await Promise.all(progress.docs.map((doc) => doc.ref.delete()));

      // 7. Delete all doctor consultations
      const consultations = await firestore
        .collection("doctorConsultations")
        .where("userId", "==", id)
        .get();
      await Promise.all(consultations.docs.map((doc) => doc.ref.delete()));

      // 8. Finally, delete the user
      await collection.doc(id).delete();

      console.log(`✅ Successfully deleted user ${id} and all related data`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      return false;
    }
  }

  async getReport(id: string): Promise<Report | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("reports").doc(id).get();
    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as Report;
  }

  async getUserReports(userId: string): Promise<Report[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("reports")
      .where("userId", "==", userId)
      .get();

    const reports = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Report)
    );

    // Sort in memory to avoid composite index requirement
    return reports.sort((a, b) => {
      // Handle Firestore Timestamp objects, Date objects, strings, and null
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (value.toDate && typeof value.toDate === "function")
          return value.toDate().getTime(); // Firestore Timestamp
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const now = new Date();
    const report: Report = {
      id,
      userId: insertReport.userId,
      fileName: insertReport.fileName,
      fileUrl: insertReport.fileUrl,
      reportType: insertReport.reportType,
      originalText: insertReport.originalText || null,
      extractedData: insertReport.extractedData || null,
      analysis: insertReport.analysis || null,
      summary: insertReport.summary || null,
      status: insertReport.status || undefined,
      uploadedAt: insertReport.uploadedAt || now,
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection("reports").doc(id).set({
      userId: report.userId,
      fileName: report.fileName,
      fileUrl: report.fileUrl,
      reportType: report.reportType,
      originalText: report.originalText,
      extractedData: report.extractedData,
      analysis: report.analysis,
      summary: report.summary,
      status: report.status,
      uploadedAt: report.uploadedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });

    return report;
  }

  async updateReport(
    id: string,
    updates: Partial<Report>
  ): Promise<Report | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const report = await this.getReport(id);
    if (!report) return undefined;

    const updatedData = { ...updates, updatedAt: new Date() };
    await firestore.collection("reports").doc(id).update(updatedData);

    return { ...report, ...updatedData };
  }

  async deleteReport(id: string): Promise<boolean> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const report = await this.getReport(id);
    if (!report) return false;

    await firestore.collection("reports").doc(id).delete();
    return true;
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("medications").doc(id).get();
    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as Medication;
  }

  async getUserMedications(userId: string): Promise<Medication[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("medications")
      .where("userId", "==", userId)
      .get();

    const medications = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Medication)
    );

    // Sort in memory to avoid composite index requirement
    return medications.sort((a, b) => {
      // Handle Firestore Timestamp objects, Date objects, strings, and null
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (value.toDate && typeof value.toDate === "function")
          return value.toDate().getTime(); // Firestore Timestamp
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }

  async getActiveMedications(userId: string): Promise<Medication[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("medications")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Medication)
    );
  }

  async createMedication(
    insertMedication: InsertMedication
  ): Promise<Medication> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const now = new Date();
    const medication: Medication = {
      id,
      userId: insertMedication.userId,
      reportId: insertMedication.reportId || null,
      name: insertMedication.name,
      dosage: insertMedication.dosage,
      frequency: insertMedication.frequency,
      duration: insertMedication.duration || null,
      instructions: insertMedication.instructions || null,
      sideEffects: insertMedication.sideEffects || null,
      isActive:
        insertMedication.isActive !== undefined
          ? insertMedication.isActive
          : true,
      prescribedBy: insertMedication.prescribedBy || null,
      doctorSpecialization: insertMedication.doctorSpecialization || null,
      prescriptionDate: insertMedication.prescriptionDate || null,
      startDate: insertMedication.startDate || null,
      endDate: insertMedication.endDate || null,
      notes: insertMedication.notes || null,
      status: insertMedication.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection("medications").doc(id).set({
      userId: medication.userId,
      reportId: medication.reportId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      instructions: medication.instructions,
      sideEffects: medication.sideEffects,
      isActive: medication.isActive,
      prescribedBy: medication.prescribedBy,
      doctorSpecialization: medication.doctorSpecialization,
      prescriptionDate: medication.prescriptionDate,
      startDate: medication.startDate,
      endDate: medication.endDate,
      notes: medication.notes,
      status: medication.status,
      createdAt: medication.createdAt,
      updatedAt: medication.updatedAt,
    });

    return medication;
  }

  async updateMedication(
    id: string,
    updates: Partial<Medication>
  ): Promise<Medication | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const medication = await this.getMedication(id);
    if (!medication) return undefined;

    const updatedData = { ...updates, updatedAt: new Date() };
    await firestore.collection("medications").doc(id).update(updatedData);

    return { ...medication, ...updatedData };
  }

  async deleteMedication(id: string): Promise<boolean> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const medication = await this.getMedication(id);
    if (!medication) return false;

    await firestore.collection("medications").doc(id).delete();
    return true;
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("reminders").doc(id).get();
    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as Reminder;
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("reminders")
      .where("userId", "==", userId)
      .get();

    const reminders = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );

    // Sort in memory to avoid composite index requirement
    return reminders.sort((a, b) => {
      // Handle Firestore Timestamp objects, Date objects, strings, and null
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (value.toDate && typeof value.toDate === "function")
          return value.toDate().getTime(); // Firestore Timestamp
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(a.scheduledTime) - getTime(b.scheduledTime);
    });
  }

  async getActiveReminders(userId: string): Promise<Reminder[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("reminders")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .where("isCompleted", "==", false)
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Reminder)
    );
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const reminder: Reminder = {
      id,
      userId: insertReminder.userId,
      medicationId: insertReminder.medicationId || null,
      type: insertReminder.type,
      title: insertReminder.title,
      message: insertReminder.message || null,
      scheduledTime: insertReminder.scheduledTime,
      isCompleted: insertReminder.isCompleted || false,
      isActive:
        insertReminder.isActive !== undefined ? insertReminder.isActive : true,
      createdAt: new Date(),
    };

    await firestore.collection("reminders").doc(id).set({
      userId: reminder.userId,
      medicationId: reminder.medicationId,
      type: reminder.type,
      title: reminder.title,
      message: reminder.message,
      scheduledTime: reminder.scheduledTime,
      isCompleted: reminder.isCompleted,
      isActive: reminder.isActive,
      createdAt: reminder.createdAt,
    });

    return reminder;
  }

  async updateReminder(
    id: string,
    updates: Partial<Reminder>
  ): Promise<Reminder | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const reminder = await this.getReminder(id);
    if (!reminder) return undefined;

    await firestore.collection("reminders").doc(id).update(updates);

    return { ...reminder, ...updates };
  }

  // Doctor Consultations
  async getDoctorConsultation(
    id: string
  ): Promise<DoctorConsultation | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("doctorConsultations").doc(id).get();
    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as DoctorConsultation;
  }

  async getUserDoctorConsultations(
    userId: string
  ): Promise<DoctorConsultation[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("doctorConsultations")
      .where("userId", "==", userId)
      .get();

    const consultations = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as DoctorConsultation)
    );

    return consultations.sort((a, b) => {
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (value.toDate && typeof value.toDate === "function")
          return value.toDate().getTime();
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(b.consultationDate) - getTime(a.consultationDate);
    });
  }

  async createDoctorConsultation(
    insertConsultation: InsertDoctorConsultation
  ): Promise<DoctorConsultation> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const now = new Date();
    const consultation: DoctorConsultation = {
      id,
      userId: insertConsultation.userId,
      reportId: insertConsultation.reportId || null,
      doctorName: insertConsultation.doctorName,
      doctorSpecialization: insertConsultation.doctorSpecialization || null,
      consultationDate: insertConsultation.consultationDate,
      diagnosis: insertConsultation.diagnosis || null,
      treatmentPlan: insertConsultation.treatmentPlan || null,
      prescriptions: insertConsultation.prescriptions || null,
      nextConsultationDate: insertConsultation.nextConsultationDate || null,
      doctorNotes: insertConsultation.doctorNotes || null,
      summary: insertConsultation.summary || null,
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection("doctorConsultations").doc(id).set({
      userId: consultation.userId,
      reportId: consultation.reportId,
      doctorName: consultation.doctorName,
      doctorSpecialization: consultation.doctorSpecialization,
      consultationDate: consultation.consultationDate,
      diagnosis: consultation.diagnosis,
      treatmentPlan: consultation.treatmentPlan,
      prescriptions: consultation.prescriptions,
      nextConsultationDate: consultation.nextConsultationDate,
      doctorNotes: consultation.doctorNotes,
      summary: consultation.summary,
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt,
    });

    return consultation;
  }

  // Health Progress
  async getUserHealthProgress(userId: string): Promise<HealthProgress[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("healthProgress")
      .where("userId", "==", userId)
      .get();

    const progress = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as HealthProgress)
    );

    return progress.sort((a, b) => {
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (value.toDate && typeof value.toDate === "function")
          return value.toDate().getTime();
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(b.recordDate) - getTime(a.recordDate);
    });
  }

  async createHealthProgress(
    insertProgress: InsertHealthProgress
  ): Promise<HealthProgress> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const progress: HealthProgress = {
      id,
      userId: insertProgress.userId,
      recordDate: insertProgress.recordDate,
      bloodPressure: insertProgress.bloodPressure || null,
      heartRate: insertProgress.heartRate || null,
      bloodSugar: insertProgress.bloodSugar || null,
      weight: insertProgress.weight || null,
      temperature: insertProgress.temperature || null,
      oxygenLevel: insertProgress.oxygenLevel || null,
      notes: insertProgress.notes || null,
      createdAt: new Date(),
    };

    await firestore.collection("healthProgress").doc(id).set({
      userId: progress.userId,
      recordDate: progress.recordDate,
      bloodPressure: progress.bloodPressure,
      heartRate: progress.heartRate,
      bloodSugar: progress.bloodSugar,
      weight: progress.weight,
      temperature: progress.temperature,
      oxygenLevel: progress.oxygenLevel,
      notes: progress.notes,
      createdAt: progress.createdAt,
    });

    return progress;
  }

  // Helper to convert Firestore Timestamps to Date objects
  private convertFirestoreTimestamps(obj: any): any {
    if (!obj) return obj;

    if (obj.toDate && typeof obj.toDate === "function") {
      return obj.toDate();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertFirestoreTimestamps(item));
    }

    if (typeof obj === "object") {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = this.convertFirestoreTimestamps(obj[key]);
      }
      return converted;
    }

    return obj;
  }

  // Health Timeline
  async getUserHealthTimeline(userId: string): Promise<HealthTimeline[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("healthTimeline")
      .where("userId", "==", userId)
      .get();

    const timeline = snapshot.docs.map((doc) => {
      const data = this.convertFirestoreTimestamps(doc.data());
      return { id: doc.id, ...data } as HealthTimeline;
    });

    // Sort in memory to avoid composite index requirement
    return timeline.sort((a, b) => {
      // Handle Date objects, strings, and null
      const getTime = (value: any): number => {
        if (!value) return 0;
        if (value instanceof Date) return value.getTime();
        if (typeof value === "string" || typeof value === "number")
          return new Date(value).getTime();
        return 0;
      };

      return getTime(b.date) - getTime(a.date);
    });
  }

  async createHealthTimelineEntry(
    insertEntry: InsertHealthTimeline
  ): Promise<HealthTimeline> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const entry: HealthTimeline = {
      id,
      userId: insertEntry.userId,
      reportId: insertEntry.reportId || null,
      consultationId: insertEntry.consultationId || null,
      date: insertEntry.date,
      eventType: insertEntry.eventType,
      reportType: insertEntry.reportType || null,
      title: insertEntry.title,
      description: insertEntry.description || null,
      summary: insertEntry.summary || null,
      analysis: insertEntry.analysis || null,
      medications: insertEntry.medications || null,
      metrics: insertEntry.metrics || null,
      severityLevel: insertEntry.severityLevel || null,
      riskLevel: insertEntry.riskLevel || null,
      comparisonData: insertEntry.comparisonData || null,
      doctorInfo: insertEntry.doctorInfo || null,
      notes: insertEntry.notes || null,
      fileUrl: insertEntry.fileUrl || null,
      createdAt: new Date(),
    };

    await firestore.collection("healthTimeline").doc(id).set({
      userId: entry.userId,
      reportId: entry.reportId,
      consultationId: entry.consultationId,
      date: entry.date,
      eventType: entry.eventType,
      reportType: entry.reportType,
      title: entry.title,
      description: entry.description,
      summary: entry.summary,
      analysis: entry.analysis,
      medications: entry.medications,
      metrics: entry.metrics,
      severityLevel: entry.severityLevel,
      riskLevel: entry.riskLevel,
      comparisonData: entry.comparisonData,
      doctorInfo: entry.doctorInfo,
      notes: entry.notes,
      fileUrl: entry.fileUrl,
      createdAt: entry.createdAt,
    });

    return entry;
  }

  async getSharedReport(token: string): Promise<SharedReport | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("sharedReports")
      .where("shareToken", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) return undefined;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SharedReport;
  }

  async getSharedReportById(id: string): Promise<SharedReport | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("sharedReports").doc(id).get();

    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as SharedReport;
  }

  async getSharedReportsByDoctorEmail(email: string): Promise<SharedReport[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("sharedReports")
      .where("doctorEmail", "==", email)
      .get();

    const reports = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SharedReport)
    );

    // Sort in memory to avoid composite index requirement
    return reports.sort((a, b) => {
      const getTime = (date: any): number => {
        if (!date) return 0;
        if (date instanceof Date) return date.getTime();
        if (typeof date === "string" || typeof date === "number")
          return new Date(date).getTime();
        return 0;
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }

  async getSharedReportsByPatientId(
    patientId: string
  ): Promise<SharedReport[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("sharedReports")
      .where("userId", "==", patientId)
      .get();

    const reports = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as SharedReport)
    );

    // Sort in memory to avoid composite index requirement
    return reports.sort((a, b) => {
      const getTime = (date: any): number => {
        if (!date) return 0;
        if (date instanceof Date) return date.getTime();
        if (typeof date === "string" || typeof date === "number")
          return new Date(date).getTime();
        return 0;
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }

  async createSharedReport(
    insertSharedReport: InsertSharedReport
  ): Promise<SharedReport> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const sharedReport: SharedReport = {
      id,
      userId: insertSharedReport.userId,
      reportIds: insertSharedReport.reportIds || null,
      shareToken: insertSharedReport.shareToken,
      doctorEmail: insertSharedReport.doctorEmail || null,
      expiresAt: insertSharedReport.expiresAt,
      isActive:
        insertSharedReport.isActive !== undefined
          ? insertSharedReport.isActive
          : true,
      viewCount: insertSharedReport.viewCount || 0,
      patientId: insertSharedReport.patientId || null,
      doctorId: insertSharedReport.doctorId || null,
      reportId: insertSharedReport.reportId || null,
      reportURL: insertSharedReport.reportURL || null,
      detectedSpecialization: insertSharedReport.detectedSpecialization || null,
      reportSummary: insertSharedReport.reportSummary || null,
      symptoms: insertSharedReport.symptoms || null,
      description: insertSharedReport.description || null,
      approvalStatus: insertSharedReport.approvalStatus || "pending",
      treatmentStatus: insertSharedReport.treatmentStatus || "active",
      createdAt: new Date(),
    };

    await firestore.collection("sharedReports").doc(id).set({
      userId: sharedReport.userId,
      reportIds: sharedReport.reportIds,
      shareToken: sharedReport.shareToken,
      doctorEmail: sharedReport.doctorEmail,
      expiresAt: sharedReport.expiresAt,
      isActive: sharedReport.isActive,
      viewCount: sharedReport.viewCount,
      patientId: sharedReport.patientId,
      doctorId: sharedReport.doctorId,
      reportId: sharedReport.reportId,
      reportURL: sharedReport.reportURL,
      detectedSpecialization: sharedReport.detectedSpecialization,
      reportSummary: sharedReport.reportSummary,
      symptoms: sharedReport.symptoms,
      description: sharedReport.description,
      approvalStatus: sharedReport.approvalStatus,
      treatmentStatus: sharedReport.treatmentStatus,
      createdAt: sharedReport.createdAt,
    });

    return sharedReport;
  }

  async updateSharedReport(
    id: string,
    updates: Partial<SharedReport>
  ): Promise<SharedReport | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const sharedReport = await firestore
      .collection("sharedReports")
      .doc(id)
      .get();
    if (!sharedReport.exists) return undefined;

    await firestore.collection("sharedReports").doc(id).update(updates);

    return {
      id: sharedReport.id,
      ...sharedReport.data(),
      ...updates,
    } as SharedReport;
  }

  async deleteReminder(id: string): Promise<boolean> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const reminder = await this.getReminder(id);
    if (!reminder) return false;

    await firestore.collection("reminders").doc(id).delete();
    return true;
  }

  async deleteAllMedicationsForUser(userId: string): Promise<number> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("medications")
      .where("userId", "==", userId)
      .get();

    let count = 0;
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        await doc.ref.delete();
        count++;
      })
    );

    return count;
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const doc = await firestore.collection("notifications").doc(id).get();
    if (!doc.exists) return undefined;

    return { id: doc.id, ...doc.data() } as Notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Notification)
    );
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Notification)
    );
  }

  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const id = randomUUID();
    const now = new Date();

    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      title: insertNotification.title,
      message: insertNotification.message,
      relatedId: insertNotification.relatedId || null,
      relatedType: insertNotification.relatedType || null,
      isRead: insertNotification.isRead || false,
      actionUrl: insertNotification.actionUrl || null,
      metadata: insertNotification.metadata || null,
      createdAt: now,
    };

    await firestore.collection("notifications").doc(id).set({
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const notification = await this.getNotification(id);
    if (!notification) return undefined;

    await firestore.collection("notifications").doc(id).update({
      isRead: true,
    });

    return { ...notification, isRead: true };
  }

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const snapshot = await firestore
      .collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    let count = 0;
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        await doc.ref.update({ isRead: true });
        count++;
      })
    );

    return count;
  }

  async deleteNotification(id: string): Promise<boolean> {
    if (!firestore) throw new Error("Firestore is not initialized");

    const notification = await this.getNotification(id);
    if (!notification) return false;

    await firestore.collection("notifications").doc(id).delete();
    return true;
  }
}

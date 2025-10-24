import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertReportSchema,
  insertMedicationSchema,
  insertReminderSchema,
} from "@shared/schema";
import {
  analyzeMedicalReport,
  extractMedicationInfo,
  generateHealthSummary,
  translateMedicalText,
} from "./services/gemini";
import {
  extractTextFromImage,
  extractTextFromPDF,
  detectDocumentType,
} from "./services/ocr";
import { verifyFirebaseToken } from "./services/firebase-verify";
import { analyzeReportForSpecialization } from "./services/ai-doctor-matching";
import { storage as firebaseStorage } from "./firebase-admin";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and PDF files are allowed."
        )
      );
    }
  },
});

// Configure multer for profile picture uploads
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, JPG, and WEBP images are allowed."
        )
      );
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure SESSION_SECRET is set for security
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required for secure session management"
    );
  }

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
      name: "sessionId", // Custom session name to avoid conflicts
    })
  );

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      if (!userData.password) {
        return res
          .status(400)
          .json({ message: "Password is required for email registration" });
      }

      // Validate specialization for doctors
      if (userData.role === "doctor" && !userData.specialization) {
        return res.status(400).json({
          message: "Specialization is required for doctor registration",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;

      res.json({
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.role !== role) {
        return res
          .status(401)
          .json({ message: "Invalid credentials or role mismatch" });
      }

      if (!user.password) {
        return res
          .status(401)
          .json({ message: "Please use Google sign-in for this account" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const updates = req.body;

      // Prevent updating sensitive fields
      delete updates.id;
      delete updates.password;
      delete updates.role;
      delete updates.firebaseUid;
      delete updates.authProvider;
      delete updates.createdAt;

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.delete("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete account" });
      }

      // Destroy session after deletion
      req.session.destroy(() => {
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Profile picture upload - Firebase Storage only
  app.post("/api/profile/picture", requireAuth, async (req, res) => {
    try {
      // Custom multer handling with error catching
      await new Promise<void>((resolve, reject) => {
        profilePictureUpload.single("profilePicture")(req, res, (err: any) => {
          if (err) {
            console.error("❌ Multer error:", err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log("📸 Profile picture upload started");

      if (!req.file) {
        console.error("❌ No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("✅ File received:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("❌ User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("✅ User found:", user.email);

      if (!firebaseStorage) {
        console.error("❌ Firebase Storage is not initialized");
        return res.status(500).json({
          message:
            "Firebase Storage is not configured. Please check your Firebase configuration.",
        });
      }

      console.log("✅ Firebase Storage is available");

      // Delete old profile picture if exists
      if (
        user.profilePictureUrl &&
        user.profilePictureUrl.includes("storage.googleapis.com")
      ) {
        try {
          console.log(
            "🗑️ Deleting old profile picture:",
            user.profilePictureUrl
          );
          const oldFileName = user.profilePictureUrl.split("/").pop();
          if (oldFileName) {
            const bucket = firebaseStorage.bucket();
            const file = bucket.file(`profile-pictures/${oldFileName}`);
            await file
              .delete()
              .catch(() =>
                console.log("Old profile picture not found or already deleted")
              );
            console.log("✅ Old profile picture deleted");
          }
        } catch (error) {
          console.warn("⚠️ Error deleting old profile picture:", error);
        }
      }

      // Upload new profile picture to Firebase Storage
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExtension}`;
      console.log("📤 Uploading file to Firebase Storage:", fileName);

      const bucket = firebaseStorage.bucket();
      console.log("✅ Bucket name:", bucket.name);

      const file = bucket.file(`profile-pictures/${fileName}`);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
        public: true,
      });
      console.log("✅ File uploaded to Firebase Storage");

      // Make the file publicly accessible
      try {
        await file.makePublic();
        console.log("✅ File made public");
      } catch (publicError: any) {
        console.warn("⚠️ Could not make file public:", publicError.message);
      }

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/profile-pictures/${fileName}`;
      console.log("✅ Firebase Storage URL generated:", publicUrl);

      // Update user profile with new picture URL
      const updatedUser = await storage.updateUser(userId, {
        profilePictureUrl: publicUrl,
      });

      if (!updatedUser) {
        console.error("❌ Failed to update user profile");
        return res.status(500).json({ message: "Failed to update profile" });
      }

      console.log("✅ User profile updated with new picture URL");

      res.json({
        message: "Profile picture uploaded successfully",
        profilePictureUrl: publicUrl,
      });
    } catch (error: any) {
      console.error("❌ Profile picture upload error:", error);
      console.error("Error stack:", error.stack);

      // Return JSON error response
      return res.status(500).json({
        message: error.message || "Upload failed",
        error:
          process.env.NODE_ENV === "development" ? error.toString() : undefined,
      });
    }
  });

  // Profile picture delete - Firebase Storage only
  app.delete("/api/profile/picture", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.profilePictureUrl) {
        return res
          .status(400)
          .json({ message: "No profile picture to delete" });
      }

      if (!firebaseStorage) {
        return res
          .status(500)
          .json({ message: "Firebase Storage is not configured" });
      }

      // Delete from Firebase Storage
      try {
        const fileName = user.profilePictureUrl.split("/").pop();
        if (fileName) {
          const bucket = firebaseStorage.bucket();
          const file = bucket.file(`profile-pictures/${fileName}`);
          await file
            .delete()
            .catch(() =>
              console.log("Profile picture not found or already deleted")
            );
          console.log("✅ Profile picture deleted from Firebase Storage");
        }
      } catch (error) {
        console.error("Error deleting profile picture from storage:", error);
      }

      // Update user profile to remove picture URL
      const updatedUser = await storage.updateUser(userId, {
        profilePictureUrl: null,
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }

      res.json({ message: "Profile picture removed successfully" });
    } catch (error) {
      console.error("Profile picture delete error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Deletion failed",
      });
    }
  });

  app.post("/api/auth/firebase-login", async (req, res) => {
    try {
      const { idToken, role, specialization, age, gender } = req.body;

      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }

      // Verify Firebase ID token
      const verifiedToken = await verifyFirebaseToken(idToken);

      if (!verifiedToken.email) {
        return res
          .status(400)
          .json({ message: "Email not found in Firebase token" });
      }

      // Parse name from Firebase token
      const displayName = verifiedToken.name || "";
      const nameParts = displayName.split(" ");
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";

      let user = await storage.getUserByEmail(verifiedToken.email);

      if (!user) {
        // Validate specialization for doctors
        if (role === "doctor" && !specialization) {
          return res.status(400).json({
            message: "Specialization is required for doctor registration",
          });
        }

        const userData: any = {
          email: verifiedToken.email,
          firstName,
          lastName,
          role: role || "patient",
          authProvider: "google",
          firebaseUid: verifiedToken.uid,
        };

        // Add specialization for doctors
        if (role === "doctor" && specialization) {
          userData.specialization = specialization;
        }

        // Add patient-specific fields
        if (role === "patient") {
          if (age) userData.age = age;
          if (gender) userData.gender = gender;
        }

        user = await storage.createUser(userData);
      } else if (user.firebaseUid !== verifiedToken.uid) {
        await storage.updateUser(user.id, {
          firebaseUid: verifiedToken.uid,
          authProvider: "google",
        });
      }

      req.session.userId = user.id;

      // Debug logging
      console.log("Firebase login successful:", {
        userId: user.id,
        sessionId: req.sessionID,
        hasSession: !!req.session,
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      res
        .status(401)
        .json({ message: "Authentication failed. Please try again." });
    }
  });

  // Debug endpoint to check session state
  app.get("/api/auth/debug", (req, res) => {
    res.json({
      hasSession: !!req.session,
      userId: req.session?.userId,
      sessionId: req.sessionID,
      sessionData: req.session,
      cookies: req.headers.cookie,
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Reports routes
  app.post(
    "/api/reports/upload",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const fileId = randomUUID();
        const fileName = req.file.originalname;
        const fileUrl = `/uploads/${fileId}_${fileName}`;

        // Create report immediately without processing
        const report = await storage.createReport({
          userId: req.session.userId!,
          fileName,
          fileUrl,
          reportType: "general", // Will be updated after processing
          originalText: "", // Will be updated after processing
          status: "processing",
        });

        // Process in background (don't await this)
        processReportAsync(report.id, req.file.buffer, req.file.mimetype).catch(
          (error) => {
            console.error(
              "Background processing failed for report",
              report.id,
              ":",
              error
            );
            // Update report status to failed
            storage
              .updateReport(report.id, {
                status: "failed",
                summary: "Processing failed due to technical error",
              })
              .catch((updateError) => {
                console.error("Failed to update report status:", updateError);
              });
          }
        );

        // Respond immediately to prevent timeout
        res.json({
          message: "File uploaded successfully",
          reportId: report.id,
        });
      } catch (error) {
        console.error("Upload route error:", error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }
  );

  // Background processing function
  async function processReportAsync(
    reportId: string,
    fileBuffer: Buffer,
    mimeType: string
  ) {
    try {
      console.log(`Starting background processing for report ${reportId}`);

      // Extract text based on file type with proper error handling
      let extractedText = "";
      let reportType = "general";
      let extractionFailed = false;

      try {
        if (mimeType === "application/pdf") {
          console.log("Processing PDF...");
          extractedText = await extractTextFromPDF(fileBuffer);
        } else {
          console.log("Processing image with OCR...");
          const ocrResult = await extractTextFromImage(fileBuffer);
          extractedText = ocrResult.text;
        }

        if (extractedText && extractedText.length > 0) {
          reportType = detectDocumentType(extractedText);
          console.log(`Detected document type: ${reportType}`);
        }
      } catch (error) {
        console.error("Text extraction failed:", error);
        extractionFailed = true;
        extractedText =
          error instanceof Error ? error.message : "Text extraction failed";
      }

      // Update report with extracted text
      await storage.updateReport(reportId, {
        originalText: extractedText,
        reportType: reportType,
      });

      let analysis = null;
      let extractedData = null;
      let summary = "";

      // Check if we have sufficient text content for analysis
      const hasMinimalContent =
        extractedText &&
        extractedText.length > 50 &&
        extractedText !== "No text detected" &&
        extractedText !== "No text found in PDF";

      // Process analysis based on document type
      try {
        if (!hasMinimalContent) {
          console.log(
            "Insufficient text content extracted. Document may be low quality or corrupted."
          );
          summary =
            "⚠️ Document uploaded but OCR could not extract readable text. This may be due to:\n\n" +
            "• Low image quality or resolution\n" +
            "• Blurry or unclear text\n" +
            "• Handwritten content (not supported)\n" +
            "• Heavy shadows or glare on the document\n\n" +
            "Please try:\n" +
            "1. Re-scanning with higher quality (at least 300 DPI)\n" +
            "2. Ensuring good lighting without shadows\n" +
            "3. Taking a clear, straight photo of the document\n" +
            "4. Using a PDF with selectable text instead of a scan";
          extractedData = {
            message: "Text extraction failed",
            extractedLength: extractedText?.length || 0,
            suggestion:
              "Upload a higher quality scan or PDF with selectable text",
          };
        } else if (reportType === "blood_test" || reportType === "general") {
          console.log("Running medical analysis...");
          analysis = await analyzeMedicalReport(extractedText);
          summary = analysis.summary;
          extractedData = analysis;
        } else if (reportType === "prescription") {
          console.log("Extracting medication info...");
          const medications = await extractMedicationInfo(extractedText);
          extractedData = { medications };
          summary = `Prescription contains ${medications.length} medication(s)`;

          // Create medication entries
          const report = await storage.getReport(reportId);
          if (report) {
            for (const med of medications) {
              try {
                await storage.createMedication({
                  userId: report.userId,
                  reportId: report.id,
                  name: med.name,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  instructions: med.instructions,
                  sideEffects: med.sideEffects?.join(", ") || "",
                  isActive: true,
                });
              } catch (medError) {
                console.error("Failed to create medication:", medError);
              }
            }
          }
        }
      } catch (analysisError) {
        console.error("Analysis failed:", analysisError);
        summary =
          "Document processed successfully. Professional medical review recommended.";
        extractedData = {
          message: "Analysis unavailable - please consult healthcare provider",
        };
      }

      // Update report with final results
      const finalStatus = extractionFailed ? "failed" : "completed";
      await storage.updateReport(reportId, {
        analysis,
        extractedData,
        summary: extractionFailed ? extractedText : summary,
        status: finalStatus,
      });

      // Create timeline entry only if processing succeeded
      if (!extractionFailed) {
        try {
          const report = await storage.getReport(reportId);
          if (report) {
            // Properly structure timeline entry with comprehensive information
            const timelineEntry: any = {
              userId: report.userId,
              reportId: report.id,
              date: report.uploadedAt || report.createdAt || new Date(),
              eventType:
                reportType === "prescription"
                  ? "prescription"
                  : reportType === "x-ray" ||
                    reportType === "mri" ||
                    reportType === "ct_scan"
                  ? "scan"
                  : "uploaded_report",
              reportType: reportType,
              title: `${reportType.replace(/_/g, " ")} - ${report.fileName}`,
              description: summary,
              summary: summary,
              fileUrl: report.fileUrl,
            };

            // Add analysis data if available
            if (analysis && typeof analysis === "object") {
              timelineEntry.analysis = analysis;
              timelineEntry.riskLevel = analysis.riskLevel || null;

              // Extract specific metrics from analysis for easy display
              if (analysis.keyFindings && Array.isArray(analysis.keyFindings)) {
                const metrics: any = {};
                analysis.keyFindings.forEach((finding: any) => {
                  if (finding.parameter && finding.value) {
                    metrics[
                      finding.parameter.toLowerCase().replace(/\s+/g, "_")
                    ] = finding.value;
                  }
                });
                if (Object.keys(metrics).length > 0) {
                  timelineEntry.metrics = metrics;
                }
              }
            }

            // Add medications for prescriptions
            if (
              reportType === "prescription" &&
              extractedData &&
              typeof extractedData === "object" &&
              "medications" in extractedData
            ) {
              timelineEntry.medications = extractedData.medications;
            }

            // Determine severity level for scans
            if (
              reportType === "x-ray" ||
              reportType === "mri" ||
              reportType === "ct_scan"
            ) {
              if (analysis && analysis.riskLevel) {
                timelineEntry.severityLevel =
                  analysis.riskLevel === "high"
                    ? "Critical"
                    : analysis.riskLevel === "medium"
                    ? "Moderate"
                    : "Low";
              }
            }

            await storage.createHealthTimelineEntry(timelineEntry);
          }
        } catch (timelineError) {
          console.error("Failed to create timeline entry:", timelineError);
          // Don't fail the whole process for timeline issues
        }
      }

      console.log(`Successfully completed processing for report ${reportId}`);
    } catch (error) {
      console.error("Report processing failed:", error);
      try {
        await storage.updateReport(reportId, {
          status: "failed",
          summary:
            "Processing failed due to technical error. Please try uploading again.",
        });
      } catch (updateError) {
        console.error("Failed to update report status:", updateError);
      }
    }
  }

  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getUserReports(req.session.userId!);
      res.json(reports);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report || report.userId !== req.session.userId) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get("/api/reports/:id/download", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report || report.userId !== req.session.userId) {
        return res.status(404).json({ message: "Report not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate formatted report content
      let content = `MEDICAL REPORT ANALYSIS\n`;
      content += `${"=".repeat(80)}\n\n`;
      content += `Patient: ${user.firstName} ${user.lastName}\n`;
      content += `Report Date: ${new Date(
        report.createdAt || new Date()
      ).toLocaleDateString()}\n`;
      content += `Report Type: ${report.reportType
        .replace("_", " ")
        .toUpperCase()}\n`;
      content += `File Name: ${report.fileName}\n`;
      content += `Status: ${(report.status || "unknown").toUpperCase()}\n\n`;
      content += `${"-".repeat(80)}\n\n`;

      if (report.summary) {
        content += `SUMMARY\n`;
        content += `${"-".repeat(80)}\n`;
        content += `${report.summary}\n\n`;
      }

      if (report.analysis) {
        const analysis = report.analysis as any;

        if (analysis.keyFindings && Array.isArray(analysis.keyFindings)) {
          content += `KEY FINDINGS\n`;
          content += `${"-".repeat(80)}\n`;
          analysis.keyFindings.forEach((finding: any, index: number) => {
            content += `\n${index + 1}. ${finding.parameter}\n`;
            content += `   Value: ${finding.value}\n`;
            content += `   Normal Range: ${finding.normalRange}\n`;
            content += `   Status: ${finding.status.toUpperCase()}\n`;
            content += `   Explanation: ${finding.explanation}\n`;
          });
          content += `\n`;
        }

        if (
          analysis.recommendations &&
          Array.isArray(analysis.recommendations)
        ) {
          content += `\nRECOMMENDATIONS\n`;
          content += `${"-".repeat(80)}\n`;
          analysis.recommendations.forEach((rec: string, index: number) => {
            content += `${index + 1}. ${rec}\n`;
          });
          content += `\n`;
        }

        if (analysis.nextSteps && Array.isArray(analysis.nextSteps)) {
          content += `\nNEXT STEPS\n`;
          content += `${"-".repeat(80)}\n`;
          analysis.nextSteps.forEach((step: string, index: number) => {
            content += `${index + 1}. ${step}\n`;
          });
          content += `\n`;
        }

        if (analysis.riskLevel) {
          content += `\nRISK LEVEL: ${analysis.riskLevel.toUpperCase()}\n\n`;
        }
      }

      if (report.extractedData) {
        const extractedData = report.extractedData as any;
        if (
          extractedData.medications &&
          Array.isArray(extractedData.medications)
        ) {
          content += `MEDICATIONS\n`;
          content += `${"-".repeat(80)}\n`;
          extractedData.medications.forEach((med: any, index: number) => {
            content += `\n${index + 1}. ${med.name}\n`;
            content += `   Dosage: ${med.dosage}\n`;
            content += `   Frequency: ${med.frequency}\n`;
            content += `   Instructions: ${med.instructions}\n`;
            if (med.sideEffects && med.sideEffects.length > 0) {
              content += `   Side Effects: ${med.sideEffects.join(", ")}\n`;
            }
          });
          content += `\n`;
        }
      }

      if (
        report.originalText &&
        report.originalText.length > 0 &&
        report.originalText !== "No text detected"
      ) {
        content += `\nORIGINAL TEXT\n`;
        content += `${"-".repeat(80)}\n`;
        content += `${report.originalText}\n\n`;
      }

      content += `${"-".repeat(80)}\n`;
      content += `\nDISCLAIMER: This analysis is for informational purposes only and is not a\n`;
      content += `substitute for professional medical advice, diagnosis, or treatment. Always\n`;
      content += `consult with your healthcare provider regarding any medical concerns.\n\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;

      // Set headers for file download
      const fileName = `medical_report_${report.id}_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.send(content);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Download failed",
      });
    }
  });

  app.delete("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (report.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this report" });
      }

      const deleted = await storage.deleteReport(req.params.id);
      if (deleted) {
        res.json({ message: "Report deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete report" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Delete failed",
      });
    }
  });

  /**
   * POST /api/uploadReport - AI-based doctor matching and report assignment
   *
   * This endpoint handles medical report uploads with automatic doctor matching.
   * It uses AI to analyze symptoms and descriptions to detect the appropriate
   * medical specialization, then finds and assigns a doctor from that specialty.
   *
   * Creates a many-to-many relationship between patients and doctors via sharedReports.
   */
  app.post("/api/uploadReport", requireAuth, async (req, res) => {
    try {
      const { patientId, reportId, reportURL } = req.body;

      // Validate required fields
      if (!patientId) {
        return res.status(400).json({ message: "patientId is required" });
      }

      if (!reportId) {
        return res.status(400).json({ message: "reportId is required" });
      }

      if (!reportURL) {
        return res.status(400).json({ message: "reportURL is required" });
      }

      // Verify the patient exists
      const patient = await storage.getUser(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      if (patient.role !== "patient") {
        return res.status(400).json({ message: "User must be a patient" });
      }

      // Authorization check: Users can only upload reports for themselves
      // Doctors might be allowed to upload on behalf of patients in the future
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      if (currentUser.role === "patient" && currentUser.id !== patientId) {
        return res
          .status(403)
          .json({ message: "You can only upload reports for yourself" });
      }

      console.log(
        "📋 Starting AI-based doctor matching for patient:",
        patientId
      );

      // Check if a shared report already exists for this reportId and patient
      const existingSharedReports = await storage.getSharedReportsByPatientId(
        patientId
      );
      const duplicateReport = existingSharedReports.find(
        (sr) => sr.reportId === reportId
      );

      if (duplicateReport) {
        console.log(
          "⚠️ Duplicate upload attempt detected - returning existing shared report"
        );

        // Get the doctor details for the existing report
        const existingDoctor = await storage.getUser(duplicateReport.doctorId!);

        if (existingDoctor) {
          return res.json({
            message: "This report has already been analyzed",
            reportId: duplicateReport.id,
            shareToken: duplicateReport.shareToken,
            suggestedDoctor: {
              id: existingDoctor.id,
              firstName: existingDoctor.firstName,
              lastName: existingDoctor.lastName,
              name: `Dr. ${existingDoctor.firstName} ${existingDoctor.lastName}`,
              email: existingDoctor.email,
              specialization: existingDoctor.specialization,
            },
            aiDetection: {
              detectedSpecialization:
                duplicateReport.detectedSpecialization || "General Physician",
              confidence: "high",
            },
            reportDetails: {
              patientId: patientId,
              reportURL: reportURL,
            },
            expiresAt: duplicateReport.expiresAt,
            approvalStatus: duplicateReport.approvalStatus,
          });
        }
      }

      // Get the report to access the extracted text
      const report = await storage.getReport(reportId);
      const reportText = report?.originalText || "";

      if (!reportText) {
        return res.status(400).json({
          message:
            "Report text could not be extracted. Please ensure the file is readable.",
        });
      }

      // AI Analysis: Detect medical specialization using ONLY the report text
      const aiAnalysis = await analyzeReportForSpecialization(reportText);
      const { specialization, confidence } = aiAnalysis;

      console.log("🤖 AI Detection Results:", {
        detectedSpecialization: specialization,
        confidence: confidence,
        analyzedText: aiAnalysis.analyzedText,
      });

      // Find a doctor with the detected specialization
      let doctors = await storage.getDoctorsBySpecialization(specialization);

      // If no doctor found with specific specialization, try General Physician
      if (doctors.length === 0 && specialization !== "General Physician") {
        console.log(
          `⚠️  No ${specialization} found, falling back to General Physician`
        );
        doctors = await storage.getDoctorsBySpecialization("General Physician");
      }

      // If still no doctors found, return error
      if (doctors.length === 0) {
        return res.status(404).json({
          message: `No doctor found with specialization: ${specialization}. Please add doctors to the system.`,
          detectedSpecialization: specialization,
          suggestion:
            "Please register doctors with appropriate specializations in the system",
        });
      }

      // Select the first available doctor (can be enhanced with load balancing logic)
      const assignedDoctor = doctors[0];

      console.log("👨‍⚕️ Doctor assigned:", {
        doctorId: assignedDoctor.id,
        doctorName: `${assignedDoctor.firstName} ${assignedDoctor.lastName}`,
        specialization: assignedDoctor.specialization,
      });

      // Generate a unique share token for the doctor-patient mapping
      const shareToken = randomUUID();

      // Set expiration to 90 days from now (can be customized)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Create the shared report entry with pending approval status
      const sharedReport = await storage.createSharedReport({
        userId: patientId,
        shareToken: shareToken,
        doctorEmail: assignedDoctor.email,
        expiresAt: expiresAt,
        isActive: true,
        viewCount: 0,
        // Extended fields for doctor-patient mapping
        patientId: patientId,
        doctorId: assignedDoctor.id,
        reportId: reportId,
        reportURL: reportURL,
        detectedSpecialization: specialization,
        reportSummary: `AI-detected condition: ${specialization}`,
        symptoms: null, // No user-provided symptoms
        description: null, // No user-provided description
        approvalStatus: "pending", // Patient must approve before doctor sees them
      });

      console.log("✅ Doctor suggested and awaiting patient approval");

      // Return success response with suggested doctor info
      res.json({
        message: "Report analyzed - Doctor suggested for approval",
        reportId: sharedReport.id,
        shareToken: shareToken,
        suggestedDoctor: {
          id: assignedDoctor.id,
          firstName: assignedDoctor.firstName,
          lastName: assignedDoctor.lastName,
          name: `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`,
          email: assignedDoctor.email,
          specialization: assignedDoctor.specialization,
        },
        aiDetection: {
          detectedSpecialization: specialization,
          confidence: confidence,
        },
        reportDetails: {
          patientId: patientId,
          reportURL: reportURL,
        },
        expiresAt: expiresAt.toISOString(),
        approvalStatus: "pending", // Indicates approval needed
      });
    } catch (error) {
      console.error("❌ Upload report error:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Report upload failed",
        details:
          "An error occurred while processing the report and assigning a doctor",
      });
    }
  });

  /**
   * PUT /api/shared-reports/:id/approve - Approve a suggested doctor
   *
   * Allows patients to approve the AI-suggested doctor for their report.
   * Once approved, the doctor can see this patient in their dashboard.
   */
  app.put("/api/shared-reports/:id/approve", requireAuth, async (req, res) => {
    try {
      const sharedReportId = req.params.id;

      // Get the shared report
      const sharedReport = await storage.getSharedReportById(sharedReportId);

      if (!sharedReport) {
        return res.status(404).json({ message: "Shared report not found" });
      }

      // Verify the patient owns this shared report
      if (sharedReport.patientId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to approve this report" });
      }

      // Check if already approved
      if (sharedReport.approvalStatus === "approved") {
        return res.status(400).json({ message: "Doctor already approved" });
      }

      // Update to approved
      const updated = await storage.updateSharedReport(sharedReportId, {
        approvalStatus: "approved",
      });

      console.log(
        `✅ Patient approved doctor assignment for shared report ${sharedReportId}`
      );

      res.json({
        message: "Doctor approved successfully",
        sharedReport: updated,
      });
    } catch (error) {
      console.error("❌ Approve doctor error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Approval failed",
      });
    }
  });

  // Medications routes
  app.get("/api/medications", requireAuth, async (req, res) => {
    try {
      const medications = await storage.getUserMedications(req.session.userId!);
      res.json(medications);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get("/api/medications/active", requireAuth, async (req, res) => {
    try {
      const medications = await storage.getActiveMedications(
        req.session.userId!
      );
      res.json(medications);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.post("/api/medications", requireAuth, async (req, res) => {
    try {
      const medicationData = insertMedicationSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });

      const medication = await storage.createMedication(medicationData);
      res.json(medication);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.patch("/api/medications/:id", requireAuth, async (req, res) => {
    try {
      const medication = await storage.getMedication(req.params.id);
      if (!medication || medication.userId !== req.session.userId) {
        return res.status(404).json({ message: "Medication not found" });
      }

      const updatedMedication = await storage.updateMedication(
        req.params.id,
        req.body
      );
      res.json(updatedMedication);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.delete("/api/medications/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Medication ID is required" });
      }

      const medication = await storage.getMedication(id);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }

      if (medication.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ message: "Unauthorized to delete this medication" });
      }

      const success = await storage.deleteMedication(id);
      if (success) {
        res.json({ message: "Medication deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete medication" });
      }
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Reminders routes
  app.get("/api/reminders", requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getUserReminders(req.session.userId!);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get("/api/reminders/active", requireAuth, async (req, res) => {
    try {
      const reminders = await storage.getActiveReminders(req.session.userId!);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.post("/api/reminders", requireAuth, async (req, res) => {
    try {
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });

      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.patch("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      const reminder = await storage.getReminder(req.params.id);
      if (!reminder || reminder.userId !== req.session.userId) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      const updatedReminder = await storage.updateReminder(
        req.params.id,
        req.body
      );
      res.json(updatedReminder);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Health timeline routes
  app.get("/api/timeline", requireAuth, async (req, res) => {
    try {
      const timeline = await storage.getUserHealthTimeline(req.session.userId!);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const reports = await storage.getUserReports(req.session.userId!);
      const activeMedications = await storage.getActiveMedications(
        req.session.userId!
      );
      const activeReminders = await storage.getActiveReminders(
        req.session.userId!
      );

      // Calculate health score (simplified)
      const completedReports = reports.filter(
        (r) => r.status === "completed"
      ).length;
      const healthScore = Math.min(
        100,
        completedReports * 10 + activeMedications.length * 5 + 50
      );

      res.json({
        totalReports: reports.length,
        activeMedications: activeMedications.length,
        pendingReminders: activeReminders.length,
        healthScore: `${healthScore}%`,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Doctor dashboard routes
  // GET /api/doctor/patients - Fetch patients mapped to this doctor via sharedReports (risk-based mapping)
  // Only returns patients who have been approved by the patient (approvalStatus === 'approved')
  app.get("/api/doctor/patients", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "doctor") {
        return res
          .status(403)
          .json({ message: "Access denied. Doctor access required." });
      }

      // Fetch sharedReports where this doctor is assigned (based on doctorEmail matching)
      const allSharedReports = await storage.getSharedReportsByDoctorEmail(
        currentUser.email
      );

      // Filter for only approved shared reports
      const sharedReports = allSharedReports.filter(
        (share: any) => share.approvalStatus === "approved"
      );

      // Extract unique patient IDs from approved sharedReports
      const patientIds = new Set<string>();
      sharedReports.forEach((share: any) => {
        if (share.userId || share.patientId) {
          patientIds.add(share.userId || share.patientId);
        }
      });

      // Fetch patient details for each unique patient
      const patients = await Promise.all(
        Array.from(patientIds).map(async (patientId) => {
          const patient = await storage.getUser(patientId);
          if (!patient) return null;

          // Get the most recent report shared with this doctor for this patient
          const patientShares = sharedReports.filter(
            (share: any) =>
              share.userId === patientId || share.patientId === patientId
          );
          const latestShare = patientShares[0]; // Already sorted by date in storage

          // Calculate patient age if dateOfBirth is available
          let age = null;
          if (patient.dateOfBirth) {
            const birthDate = new Date(patient.dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (
              monthDiff < 0 ||
              (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ) {
              age--;
            }
          }

          return {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            age: age,
            phone: patient.phone,
            dateOfBirth: patient.dateOfBirth,
            profilePictureUrl: patient.profilePictureUrl || null,
            // Include report details from the latest approved sharedReport
            lastReportSummary: latestShare?.reportSummary || null,
            lastReportDate: latestShare?.createdAt || null,
            detectedSpecialization: latestShare?.detectedSpecialization || null,
            symptoms: latestShare?.symptoms || null,
            description: latestShare?.description || null,
            reportURL: latestShare?.reportURL || null,
            approvalStatus: latestShare?.approvalStatus || "pending",
          };
        })
      );

      // Filter out null values (patients that couldn't be found)
      const validPatients = patients.filter(
        (p): p is NonNullable<typeof p> => p !== null
      );

      res.json(validPatients);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get(
    "/api/doctor/patient/:patientId/reports",
    requireAuth,
    async (req, res) => {
      try {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser || currentUser.role !== "doctor") {
          return res
            .status(403)
            .json({ message: "Access denied. Doctor access required." });
        }

        const reports = await storage.getUserReports(req.params.patientId);
        const patient = await storage.getUser(req.params.patientId);
        const medications = await storage.getUserMedications(
          req.params.patientId
        );
        const timeline = await storage.getUserHealthTimeline(
          req.params.patientId
        );

        res.json({
          patient: patient
            ? {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                phone: patient.phone,
                profilePictureUrl: patient.profilePictureUrl || null,
              }
            : null,
          reports,
          medications,
          timeline,
        });
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  app.get(
    "/api/doctor/patient/:patientId/timeline",
    requireAuth,
    async (req, res) => {
      try {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser || currentUser.role !== "doctor") {
          return res
            .status(403)
            .json({ message: "Access denied. Doctor access required." });
        }

        const patient = await storage.getUser(req.params.patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }

        const timeline = await storage.getUserHealthTimeline(
          req.params.patientId
        );

        res.json({
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            dateOfBirth: patient.dateOfBirth,
            phone: patient.phone,
          },
          timeline,
        });
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  app.get("/api/doctor/shared-reports", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "doctor") {
        return res
          .status(403)
          .json({ message: "Access denied. Doctor access required." });
      }

      const sharedReports = await storage.getSharedReportsByDoctorEmail(
        currentUser.email
      );

      const enrichedShares = await Promise.all(
        sharedReports.map(async (share: any) => {
          const patient = await storage.getUser(share.userId);
          const reports = [];
          for (const reportId of share.reportIds) {
            const report = await storage.getReport(reportId);
            if (report) {
              reports.push(report);
            }
          }

          return {
            id: share.id,
            shareToken: share.shareToken,
            patient: patient
              ? {
                  id: patient.id,
                  firstName: patient.firstName,
                  lastName: patient.lastName,
                  email: patient.email,
                  profilePictureUrl: patient.profilePictureUrl || null,
                }
              : null,
            reports,
            createdAt: share.createdAt,
            expiresAt: share.expiresAt,
            viewCount: share.viewCount,
            isActive: share.isActive && new Date() < share.expiresAt,
            symptoms: share.symptoms || null,
            description: share.description || null,
            detectedSpecialization: share.detectedSpecialization || null,
            reportSummary: share.reportSummary || null,
            approvalStatus: share.approvalStatus || "pending",
          };
        })
      );

      res.json(enrichedShares);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Patient dashboard routes
  // GET /api/patient/doctors - Fetch all doctors currently treating this patient
  // Returns doctors assigned based on risk detection in patient's reports via sharedReports
  app.get("/api/patient/doctors", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all sharedReports for this patient (userId matches)
      const patientShares = await storage.getSharedReportsByPatientId(
        req.session.userId!
      );

      // Extract unique doctor emails and fetch doctor details
      const doctorEmails = new Set<string>();
      patientShares.forEach((share: any) => {
        if (share.doctorEmail) {
          doctorEmails.add(share.doctorEmail);
        }
      });

      // Fetch all doctors and filter by email
      const allDoctors = await storage.getAllDoctors();
      const assignedDoctors = allDoctors.filter((doctor) =>
        doctorEmails.has(doctor.email)
      );

      // Enrich doctor data with assignment details
      const enrichedDoctors = assignedDoctors.map((doctor) => {
        const doctorShares = patientShares.filter(
          (share: any) => share.doctorEmail === doctor.email
        );
        const latestShare = doctorShares[0]; // Most recent assignment

        return {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          email: doctor.email,
          specialization: doctor.specialization,
          profilePictureUrl: doctor.profilePictureUrl || null,
          // Include assignment details
          assignedDate: latestShare?.createdAt || null,
          detectedSpecialization: latestShare?.detectedSpecialization || null,
          reportSummary: latestShare?.reportSummary || null,
        };
      });

      res.json(enrichedDoctors);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // GET /api/patient/:patientId/healthTimeline - Fetch health timeline for a specific patient
  // Accessible by the patient themselves or by doctors
  app.get(
    "/api/patient/:patientId/healthTimeline",
    requireAuth,
    async (req, res) => {
      try {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const patientId = req.params.patientId;

        // Check authorization: user must be the patient or a doctor
        if (currentUser.id !== patientId && currentUser.role !== "doctor") {
          return res.status(403).json({
            message: "Access denied. You can only view your own timeline.",
          });
        }

        const timeline = await storage.getUserHealthTimeline(patientId);
        const patient = await storage.getUser(patientId);

        res.json({
          patient: patient
            ? {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
              }
            : null,
          timeline,
        });
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  // Translation routes
  app.post("/api/translate", requireAuth, async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res
          .status(400)
          .json({ message: "Text and target language are required" });
      }

      const translatedText = await translateMedicalText(text, targetLanguage);
      res.json({ translatedText });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  // Sharing routes
  app.post("/api/share/create", requireAuth, async (req, res) => {
    try {
      const { reportIds, doctorEmail, expiresInDays = 7 } = req.body;

      const shareToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const sharedReport = await storage.createSharedReport({
        userId: req.session.userId!,
        reportIds,
        shareToken,
        doctorEmail,
        expiresAt,
        isActive: true,
        viewCount: 0,
      });

      res.json({
        shareToken,
        shareUrl: `${req.protocol}://${req.get("host")}/shared/${shareToken}`,
        expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  app.get("/api/share/:token", async (req, res) => {
    try {
      const sharedReport = await storage.getSharedReport(req.params.token);
      if (
        !sharedReport ||
        !sharedReport.isActive ||
        new Date() > sharedReport.expiresAt
      ) {
        return res
          .status(404)
          .json({ message: "Shared report not found or expired" });
      }

      // Increment view count
      await storage.updateSharedReport(sharedReport.id, {
        viewCount: (sharedReport.viewCount || 0) + 1,
      });

      // Get the shared reports
      const reports = [];
      for (const reportId of sharedReport.reportIds || []) {
        const report = await storage.getReport(reportId);
        if (report) {
          reports.push(report);
        }
      }

      // Get user info
      const user = await storage.getUser(sharedReport.userId);
      const medications = await storage.getActiveMedications(
        sharedReport.userId
      );

      // Generate summary
      const healthSummary = await generateHealthSummary(reports, medications);

      res.json({
        patient: user ? `${user.firstName} ${user.lastName}` : "Patient",
        reports,
        medications,
        healthSummary,
        sharedAt: sharedReport.createdAt,
        viewCount: (sharedReport.viewCount || 0) + 1,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Operation failed",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

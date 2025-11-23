import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { randomUUID } from "crypto";

export function registerShareRoutes(app: Express) {
  // Share Report with Doctor endpoint
  app.post(
    "/api/share-report",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { patientId, doctorId, reportId, reportName, reportURL } =
          req.body;

        // Validate required fields
        if (!patientId || !doctorId || !reportId || !reportName || !reportURL) {
          return res.status(400).json({
            message:
              "Missing required fields: patientId, doctorId, reportId, reportName, reportURL",
          });
        }

        // Verify the patient exists
        const patient = await storage.getUser(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }

        // Verify the doctor exists
        const doctor = await storage.getUser(doctorId);
        if (!doctor || doctor.role !== "doctor") {
          return res.status(404).json({ message: "Doctor not found" });
        }

        // Verify the report exists and belongs to the patient
        const report = await storage.getReport(reportId);
        if (!report || report.userId !== patientId) {
          return res
            .status(404)
            .json({ message: "Report not found or unauthorized" });
        }

        // Get file type from URL or report
        const fileType = reportURL.includes(".pdf")
          ? "application/pdf"
          : reportURL.includes(".jpg") || reportURL.includes(".jpeg")
          ? "image/jpeg"
          : reportURL.includes(".png")
          ? "image/png"
          : "unknown";

        // Save the report record in Firestore using our new helper function
        await storage.saveReportRecord({
          reportId: reportId,
          reportName: reportName,
          reportURL: reportURL,
          uploadDate: new Date(),
          fileType: fileType,
          patientId: patientId,
        });

        // Create a unique ID for the shared report
        const sharedReportId = randomUUID();

        // Share the report with the doctor using our new helper function
        await storage.shareReportWithDoctor({
          sharedReportId: sharedReportId,
          patientId: patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          doctorId: doctorId,
          reportId: reportId,
          reportName: reportName,
          reportURL: reportURL,
          timestamp: Date.now(),
        });

        // Get the doctor's email for the shared report (for compatibility)
        const doctorEmail = doctor.email;

        // Create the shared report entry in Firestore under doctors/{doctorId}/sharedReports
        // (Maintaining compatibility with existing system)
        const sharedReportData = {
          patientId: patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          doctorId: doctorId,
          reportId: reportId,
          reportName: reportName,
          reportURL: reportURL,
          timestamp: Date.now(),
          doctorEmail: doctorEmail, // For compatibility with existing system
          userId: patientId, // For compatibility with existing system
          shareToken: randomUUID(), // For compatibility with existing system
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          isActive: true,
          viewCount: 0,
        };

        const sharedReport = await storage.createSharedReport(sharedReportData);

        // Create notification for the doctor
        await storage.createNotification({
          userId: doctorId,
          type: "report",
          title: "New Report Shared",
          message: `${patient.firstName} ${patient.lastName} has shared a report with you: ${reportName}`,
          relatedId: sharedReport.id,
          relatedType: "shared_report",
          actionUrl: "/doctor/shared-reports",
          metadata: {
            patientId: patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            reportName: reportName,
          },
        });

        res.json({
          message: "Report shared successfully",
          sharedReportId: sharedReport.id,
        });
      } catch (error) {
        console.error("Share report error:", error);
        res.status(500).json({
          message:
            error instanceof Error ? error.message : "Failed to share report",
        });
      }
    }
  );

  // Get mapped doctor for a patient
  app.get(
    "/api/patient/mapped-doctor",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = req.session.userId!;
        const doctors = await storage.getMappedDoctor(patientId);

        if (!doctors) {
          return res.status(404).json({ message: "No mapped doctors found" });
        }

        res.json(doctors);
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  // Get patient reports
  app.get(
    "/api/patient/reports",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = req.session.userId!;
        const reports = await storage.getPatientReports(patientId);
        res.json(reports);
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  // Get shared reports for a doctor
  app.get(
    "/api/doctor/shared-reports",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const doctorId = req.session.userId!;

        // Try to get shared reports using our new helper function first
        let sharedReports = [];
        try {
          sharedReports = await storage.getDoctorSharedReports(doctorId);
        } catch {
          console.log("Fallback to existing method for shared reports");
          // Fallback to existing method if new method fails
          sharedReports = await storage.getSharedReports(doctorId);
        }

        // If we still don't have reports, try the existing method
        if (sharedReports.length === 0) {
          sharedReports = await storage.getSharedReports(doctorId);
        }

        // Enrich shared reports with patient information
        const enrichedReports = await Promise.all(
          sharedReports.map(async (report) => {
            // Get patient info
            const patient = report.patientId
              ? await storage.getUser(report.patientId)
              : null;

            return {
              ...report,
              patient: patient
                ? {
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    email: patient.email,
                    profilePictureUrl: patient.profilePictureUrl || null,
                  }
                : null,
            };
          })
        );

        res.json(enrichedReports);
      } catch (error) {
        res.status(500).json({
          message: error instanceof Error ? error.message : "Operation failed",
        });
      }
    }
  );

  // Authentication middleware
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }
    next();
  }
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertJobSchema, insertApplicationSchema } from "@shared/schema";
import { 
  sendOTPEmail, 
  sendApplicationSubmittedEmail, 
  sendApplicationAcceptedEmail, 
  sendApplicationDeclinedEmail,
  sendAdminNotificationEmail 
} from "./email";

// Extend Express Session
declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, name, role } = z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(["student", "admin"]),
      }).parse(req.body);

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const createdOtp = await storage.createOtp({ email, code: otp, expiresAt });
      console.log("routes: created OTP:", { id: createdOtp.id, email: createdOtp.email, code: createdOtp.code, expiresAt: createdOtp.expiresAt?.toISOString && createdOtp.expiresAt.toISOString(), createdAt: createdOtp.createdAt?.toISOString && createdOtp.createdAt.toISOString() });

      // Send OTP email
      const emailSent = await sendOTPEmail(email, otp, name);
      
      if (!emailSent) {
        console.warn("Email failed to send, but OTP was stored. In development, check console for OTP:", otp);
      }

      res.json({ 
        success: true, 
        message: "OTP sent to email",
        // In development, include OTP in response for testing (remove in production!)
        ...(process.env.NODE_ENV === "development" && { devOtp: otp })
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code, name, role } = z.object({
        email: z.string().email(),
        code: z.string().length(6),
        name: z.string().min(1),
        role: z.enum(["student", "admin"]),
      }).parse(req.body);

      const latestOtp = await storage.getLatestOtpByEmail(email);
      console.log("routes: fetched latestOtp:", latestOtp && { id: latestOtp.id, email: latestOtp.email, code: latestOtp.code, expiresAt: latestOtp.expiresAt?.toISOString && latestOtp.expiresAt.toISOString(), createdAt: latestOtp.createdAt?.toISOString && latestOtp.createdAt.toISOString() });

      if (!latestOtp) {
        return res.status(400).json({ error: "No OTP found" });
      }

      if (latestOtp.code !== code) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      if (new Date() > latestOtp.expiresAt) {
        await storage.deleteOtp(latestOtp.id);
        return res.status(400).json({ error: "OTP expired" });
      }

      // Delete used OTP
      await storage.deleteOtp(latestOtp.id);

      // Find or create user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email, name, role, isVerified: "true" });
      } else {
        user = await storage.updateUser(user.id, { isVerified: "true" }) || user;
      }

      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Job Routes
  app.post("/api/jobs", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const jobData = insertJobSchema.parse({
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        description: req.body.description,
        requirements: req.body.requirements,
        deadline: new Date(req.body.deadline),
        postedBy: req.session.userId,
      });

      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error) {
      console.error("Create job error:", error);
      res.status(400).json({ error: "Invalid job data" });
    }
  });

  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Application Routes
  app.post("/api/applications", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== "student") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { jobId } = z.object({
        jobId: z.string(),
      }).parse(req.body);

      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if already applied
      const existingApp = await storage.getApplicationByJobAndStudent(jobId, req.session.userId);
      if (existingApp) {
        return res.status(400).json({ error: "Already applied to this job" });
      }

      const application = await storage.createApplication({
        jobId,
        studentId: req.session.userId,
        status: "pending",
      });

      // Send confirmation email to student
      const student = await storage.getUser(req.session.userId);
      if (student) {
        try {
          await sendApplicationSubmittedEmail(student.email, student.name, job.title, job.company);
        } catch (emailError) {
          console.error("Failed to send application email:", emailError);
        }

        // Send notification to admin
        const admin = await storage.getUser(job.postedBy);
        if (admin) {
          try {
            await sendAdminNotificationEmail(admin.email, student.name, job.title);
          } catch (emailError) {
            console.error("Failed to send admin notification:", emailError);
          }
        }
      }

      res.json(application);
    } catch (error) {
      console.error("Create application error:", error);
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  app.get("/api/applications/my", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      let applications;
      if (req.session.userRole === "student") {
        applications = await storage.getApplicationsByStudent(req.session.userId);
      } else {
        return res.status(403).json({ error: "Only students can view their applications" });
      }

      // Fetch job details for each application
      const applicationsWithJobs = await Promise.all(
        applications.map(async (app) => {
          const job = await storage.getJob(app.jobId);
          return { ...app, job };
        })
      );

      res.json(applicationsWithJobs);
    } catch (error) {
      console.error("Get my applications error:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/jobs/:jobId/applications", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const job = await storage.getJob(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.postedBy !== req.session.userId) {
        return res.status(403).json({ error: "Not your job posting" });
      }

      const applications = await storage.getApplicationsByJob(req.params.jobId);

      // Fetch student details for each application
      const applicationsWithStudents = await Promise.all(
        applications.map(async (app) => {
          const student = await storage.getUser(app.studentId);
          return { ...app, student };
        })
      );

      res.json(applicationsWithStudents);
    } catch (error) {
      console.error("Get job applications error:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { status } = z.object({
        status: z.enum(["pending", "accepted", "declined"]),
      }).parse(req.body);

      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const job = await storage.getJob(application.jobId);
      if (!job || job.postedBy !== req.session.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updatedApplication = await storage.updateApplicationStatus(req.params.id, status);

      // Send email to student
      const student = await storage.getUser(application.studentId);
      if (student && job) {
        try {
          if (status === "accepted") {
            await sendApplicationAcceptedEmail(student.email, student.name, job.title, job.company);
          } else if (status === "declined") {
            await sendApplicationDeclinedEmail(student.email, student.name, job.title, job.company);
          }
        } catch (emailError) {
          console.error("Failed to send status email:", emailError);
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Update application status error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

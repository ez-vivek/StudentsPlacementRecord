import { type User, type InsertUser, type Job, type InsertJob, type Application, type InsertApplication, type Otp, type InsertOtp } from "@shared/schema";
import { randomUUID } from "node:crypto";
import { SupabaseStorage } from "./supabase-storage";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // OTP
  createOtp(otp: InsertOtp): Promise<Otp>;
  getLatestOtpByEmail(email: string): Promise<Otp | undefined>;
  deleteOtp(id: string): Promise<void>;

  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByAdmin(adminId: string): Promise<Job[]>;

  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsByJob(jobId: string): Promise<Application[]>;
  getApplicationsByStudent(studentId: string): Promise<Application[]>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;
  getApplicationByJobAndStudent(jobId: string, studentId: string): Promise<Application | undefined>;
}

// Use Supabase if credentials are available, otherwise use in-memory storage
const hasSupabaseCredentials = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otps: Map<string, Otp>;
  private jobs: Map<string, Job>;
  private applications: Map<string, Application>;

  constructor() {
    this.users = new Map();
    this.otps = new Map();
    this.jobs = new Map();
    this.applications = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, isVerified: insertUser.isVerified || "false" };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // OTP
  async createOtp(insertOtp: InsertOtp): Promise<Otp> {
    const id = randomUUID();
    const otp: Otp = { ...insertOtp, id, createdAt: new Date() };
    this.otps.set(id, otp);
    return otp;
  }

  async getLatestOtpByEmail(email: string): Promise<Otp | undefined> {
    const userOtps = Array.from(this.otps.values())
      .filter(otp => otp.email === email)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return userOtps[0];
  }

  async deleteOtp(id: string): Promise<void> {
    this.otps.delete(id);
  }

  // Jobs
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { ...insertJob, id, createdAt: new Date() };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getJobsByAdmin(adminId: string): Promise<Job[]> {
    return Array.from(this.jobs.values())
      .filter(job => job.postedBy === adminId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Applications
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const application: Application = { 
      ...insertApplication, 
      id, 
      status: insertApplication.status || "pending",
      appliedAt: new Date() 
    };
    this.applications.set(id, application);
    return application;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.jobId === jobId)
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    return Array.from(this.applications.values())
      .filter(app => app.studentId === studentId)
      .sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    const updatedApplication = { ...application, status };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async getApplicationByJobAndStudent(jobId: string, studentId: string): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      app => app.jobId === jobId && app.studentId === studentId
    );
  }
}

export const storage: IStorage = (() => {
  if (!hasSupabaseCredentials) {
    console.log("Using in-memory storage (Supabase credentials not configured)");
    return new MemStorage();
  }
  console.log("Using Supabase storage");
  return new SupabaseStorage();
})();

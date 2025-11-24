import { createClient } from "@supabase/supabase-js";
import type { IStorage } from "./storage";
import type { User, InsertUser, Job, InsertJob, Application, InsertApplication, Otp, InsertOtp } from "@shared/schema";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) return undefined;
      return data as User;
    } catch (e) {
      console.error("Supabase error:", e);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) return undefined;
      return data as User;
    } catch (e) {
      console.error("Supabase error:", e);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert([{
        email: user.email,
        name: user.name,
        role: user.role,
        is_verified: user.isVerified || "false",
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      isVerified: data.is_verified,
    } as User;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const updateData: any = {};
    if (updates.isVerified) updateData.is_verified = updates.isVerified;
    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      isVerified: data.is_verified,
    } as User;
  }

  // OTP
  async createOtp(otp: InsertOtp): Promise<Otp> {
    console.log("SupabaseStorage.createOtp - inserting OTP for", otp.email, "expiresAt:", otp.expiresAt?.toISOString && otp.expiresAt.toISOString());
    const { data, error } = await supabase
      .from("otp_codes")
      .insert([{
        email: otp.email,
        code: otp.code,
        // store as ISO string; DB may drop the Z when returning, so parse defensively on read
        expires_at: otp.expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create OTP: ${error.message}`);
    console.log("SupabaseStorage.createOtp - inserted data.expires_at:", data.expires_at);
    const parseTs = (ts: string) => {
      if (!ts) return new Date(ts);
      // If timestamp string has timezone (Z or +/-), parse directly
      if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(ts)) return new Date(ts);
      // Otherwise assume DB returned a naive local timestamp string; treat it as UTC by appending 'Z'
      return new Date(ts + 'Z');
    };

    return {
      id: data.id,
      email: data.email,
      code: data.code,
      expiresAt: parseTs(data.expires_at),
      createdAt: parseTs(data.created_at),
    } as Otp;
  }

  async getLatestOtpByEmail(email: string): Promise<Otp | undefined> {
    const { data, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return undefined;
    console.log("SupabaseStorage.getLatestOtpByEmail - fetched data.expires_at:", data.expires_at);
    const parseTs = (ts: string) => {
      if (!ts) return new Date(ts);
      if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(ts)) return new Date(ts);
      return new Date(ts + 'Z');
    };
    const parsed = parseTs(data.expires_at);
    console.log("SupabaseStorage.getLatestOtpByEmail - parsed expiresAt:", parsed.toISOString());
    console.log("SupabaseStorage.getLatestOtpByEmail - now:", new Date().toISOString(), "parsed > now?", parsed.getTime() > Date.now());
    return {
      id: data.id,
      email: data.email,
      code: data.code,
      expiresAt: parsed,
      createdAt: parseTs(data.created_at),
    } as Otp;
  }

  async deleteOtp(id: string): Promise<void> {
    const { error } = await supabase
      .from("otp_codes")
      .delete()
      .eq("id", id);

    if (error) console.error("Failed to delete OTP:", error);
  }

  // Jobs
  async createJob(job: InsertJob): Promise<Job> {
    const { data, error } = await supabase
      .from("jobs")
      .insert([{
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        deadline: job.deadline.toISOString(),
        posted_by: job.postedBy,
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements,
      deadline: new Date(data.deadline),
      postedBy: data.posted_by,
      createdAt: new Date(data.created_at),
    } as Job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements,
      deadline: new Date(data.deadline),
      postedBy: data.posted_by,
      createdAt: new Date(data.created_at),
    } as Job;
  }

  async getAllJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      deadline: new Date(job.deadline),
      postedBy: job.posted_by,
      createdAt: new Date(job.created_at),
    })) as Job[];
  }

  async getJobsByAdmin(adminId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("posted_by", adminId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      deadline: new Date(job.deadline),
      postedBy: job.posted_by,
      createdAt: new Date(job.created_at),
    })) as Job[];
  }

  // Applications
  async createApplication(application: InsertApplication): Promise<Application> {
    const { data, error } = await supabase
      .from("applications")
      .insert([{
        job_id: application.jobId,
        student_id: application.studentId,
        status: application.status || "pending",
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create application: ${error.message}`);
    return {
      id: data.id,
      jobId: data.job_id,
      studentId: data.student_id,
      status: data.status,
      appliedAt: new Date(data.applied_at),
    } as Application;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      jobId: data.job_id,
      studentId: data.student_id,
      status: data.status,
      appliedAt: new Date(data.applied_at),
    } as Application;
  }

  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("job_id", jobId);

    if (error || !data) return [];
    return data.map((app: any) => ({
      id: app.id,
      jobId: app.job_id,
      studentId: app.student_id,
      status: app.status,
      appliedAt: new Date(app.applied_at),
    })) as Application[];
  }

  async getApplicationsByStudent(studentId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("student_id", studentId);

    if (error || !data) return [];
    return data.map((app: any) => ({
      id: app.id,
      jobId: app.job_id,
      studentId: app.student_id,
      status: app.status,
      appliedAt: new Date(app.applied_at),
    })) as Application[];
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      jobId: data.job_id,
      studentId: data.student_id,
      status: data.status,
      appliedAt: new Date(data.applied_at),
    } as Application;
  }

  async getApplicationByJobAndStudent(jobId: string, studentId: string): Promise<Application | undefined> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("job_id", jobId)
      .eq("student_id", studentId)
      .single();

    if (error || !data) return undefined;
    return {
      id: data.id,
      jobId: data.job_id,
      studentId: data.student_id,
      status: data.status,
      appliedAt: new Date(data.applied_at),
    } as Application;
  }
}

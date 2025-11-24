import { apiRequest } from "./queryClient";
import type { User, Job, Application } from "@shared/schema";

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  message?: string;
}

export const api = {
  // Auth
  sendOTP: async (email: string, name: string, role: "student" | "admin") => {
    const res = await apiRequest("POST", "/api/auth/send-otp", { email, name, role });
    return res.json();
  },

  verifyOTP: async (email: string, code: string, name: string, role: "student" | "admin") => {
    const res = await apiRequest("POST", "/api/auth/verify-otp", { email, code, name, role });
    return res.json() as Promise<AuthResponse>;
  },

  getMe: async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");
    return res.json() as Promise<User>;
  },

  logout: async () => {
    const res = await apiRequest("POST", "/api/auth/logout");
    return res.json();
  },

  // Jobs
  createJob: async (data: {
    title: string;
    company: string;
    location: string;
    description: string;
    requirements: string;
    deadline: Date;
  }) => {
    const res = await apiRequest("POST", "/api/jobs", data);
    return res.json() as Promise<Job>;
  },

  getJobs: async () => {
    const res = await fetch("/api/jobs", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch jobs");
    return res.json() as Promise<Job[]>;
  },

  getJob: async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch job");
    return res.json() as Promise<Job>;
  },

  // Applications
  applyToJob: async (jobId: string) => {
    const res = await apiRequest("POST", "/api/applications", { jobId });
    return res.json() as Promise<Application>;
  },

  getMyApplications: async () => {
    const res = await fetch("/api/applications/my", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch applications");
    return res.json() as Promise<(Application & { job?: Job })[]>;
  },

  getJobApplications: async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}/applications`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch applications");
    return res.json() as Promise<(Application & { student?: User })[]>;
  },

  updateApplicationStatus: async (applicationId: string, status: "accepted" | "declined") => {
    const res = await apiRequest("PATCH", `/api/applications/${applicationId}/status`, { status });
    return res.json() as Promise<Application>;
  },
};

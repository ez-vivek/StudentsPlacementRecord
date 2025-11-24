import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Users, Plus, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import StatsCard from "@/components/StatsCard";
import JobCard from "@/components/JobCard";
import ApplicationCard from "@/components/ApplicationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().min(1, "Requirements are required"),
  deadline: z.string().min(1, "Deadline is required"),
});

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: api.getJobs,
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ["/api/jobs", selectedJob, "applications"],
    queryFn: () => selectedJob ? api.getJobApplications(selectedJob) : Promise.resolve([]),
    enabled: !!selectedJob && activeTab === "applications",
  });

  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      description: "",
      requirements: "",
      deadline: "",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: z.infer<typeof jobFormSchema>) =>
      api.createJob({
        ...data,
        deadline: new Date(data.deadline),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Job posting created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job posting",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "declined" }) =>
      api.updateApplicationStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", selectedJob, "applications"] });
      toast({
        title: "Success",
        description: `Application ${variables.status}! Email notification sent to student.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "AD";

  const style = {
    "--sidebar-width": "16rem",
  };

  const pendingCount = allApplications.filter(app => app.status === "pending").length;
  const acceptedCount = allApplications.filter(app => app.status === "accepted").length;

  const onSubmit = (data: z.infer<typeof jobFormSchema>) => {
    createJobMutation.mutate(data);
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">Administrator</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("jobs")}
                      isActive={activeTab === "jobs"}
                      data-testid="nav-manage-jobs"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Manage Jobs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("applications")}
                      isActive={activeTab === "applications"}
                      data-testid="nav-applications"
                    >
                      <Users className="w-4 h-4" />
                      <span>Applications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto border-t p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} data-testid="button-logout">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage job postings and review applications
                  </p>
                </div>
                
                {activeTab === "jobs" && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-job">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Job Posting</DialogTitle>
                        <DialogDescription>
                          Fill in the details to post a new job opportunity
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-job-title" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-company" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-location" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} data-testid="input-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="requirements"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Requirements (comma-separated)</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-requirements" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Application Deadline</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-deadline" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              data-testid="button-submit-job"
                              disabled={createJobMutation.isPending}
                            >
                              {createJobMutation.isPending ? "Creating..." : "Create Job Posting"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Jobs" value={jobs.length} icon={Briefcase} />
                <StatsCard title="Applications" value={allApplications.length} icon={Users} />
                <StatsCard title="Pending Review" value={pendingCount} icon={Users} />
                <StatsCard title="Accepted" value={acceptedCount} icon={Users} />
              </div>

              {activeTab === "jobs" && (
                <>
                  {jobsLoading ? (
                    <p className="text-center text-muted-foreground">Loading jobs...</p>
                  ) : jobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      No job postings yet. Create your first job posting!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isAdmin
                          onViewApplications={(id) => {
                            setSelectedJob(id);
                            setActiveTab("applications");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "applications" && (
                <div className="space-y-4">
                  {!selectedJob ? (
                    <p className="text-center text-muted-foreground py-12">
                      Select a job from the "Manage Jobs" tab to view applications
                    </p>
                  ) : allApplications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      No applications yet for this job
                    </p>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold">Applications</h2>
                      {allApplications.map((app) => (
                        <ApplicationCard
                          key={app.id}
                          application={app}
                          onAccept={(id) => updateStatusMutation.mutate({ id, status: "accepted" })}
                          onDecline={(id) => updateStatusMutation.mutate({ id, status: "declined" })}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

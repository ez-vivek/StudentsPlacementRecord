import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Briefcase, Clock, CheckCircle, XCircle, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import StatsCard from "@/components/StatsCard";
import JobCard from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: api.getJobs,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications/my"],
    queryFn: api.getMyApplications,
  });

  const applyMutation = useMutation({
    mutationFn: api.applyToJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });
      toast({
        title: "Success",
        description: "Application submitted successfully! You'll receive an email confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const appliedJobIds = applications.map(app => app.jobId);
  const acceptedCount = applications.filter(app => app.status === "accepted").length;
  const declinedCount = applications.filter(app => app.status === "declined").length;

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "??";

  const style = {
    "--sidebar-width": "16rem",
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
                <p className="text-xs text-muted-foreground truncate">Student</p>
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
                      onClick={() => setActiveTab("browse")}
                      isActive={activeTab === "browse"}
                      data-testid="nav-browse-jobs"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Browse Jobs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab("applications")}
                      isActive={activeTab === "applications"}
                      data-testid="nav-my-applications"
                    >
                      <Clock className="w-4 h-4" />
                      <span>My Applications</span>
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
              <div>
                <h1 className="text-3xl font-bold">Student Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  {activeTab === "browse" ? "Explore available opportunities" : "Track your application status"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Available Jobs"
                  value={jobs.length}
                  icon={Briefcase}
                />
                <StatsCard
                  title="Applications"
                  value={applications.length}
                  icon={Clock}
                />
                <StatsCard
                  title="Accepted"
                  value={acceptedCount}
                  icon={CheckCircle}
                />
                <StatsCard
                  title="Declined"
                  value={declinedCount}
                  icon={XCircle}
                />
              </div>

              {activeTab === "browse" && (
                <>
                  <div className="flex gap-4 flex-wrap">
                    <Input
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                      data-testid="input-search-jobs"
                    />
                  </div>

                  {jobsLoading ? (
                    <p className="text-center text-muted-foreground">Loading jobs...</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          hasApplied={appliedJobIds.includes(job.id)}
                          onApply={(jobId) => applyMutation.mutate(jobId)}
                        />
                      ))}
                    </div>
                  )}

                  {!jobsLoading && filteredJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      No jobs found matching your criteria.
                    </p>
                  )}
                </>
              )}

              {activeTab === "applications" && (
                <div className="space-y-4">
                  {applicationsLoading ? (
                    <p className="text-center text-muted-foreground">Loading applications...</p>
                  ) : applications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      You haven't applied to any jobs yet. Start browsing to find opportunities!
                    </p>
                  ) : (
                    applications.map((app) => (
                      <Card key={app.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl truncate">
                                {app.job?.title || "Unknown Job"}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {app.job?.company} • {app.job?.location}
                              </p>
                            </div>
                            <StatusBadge status={app.status as any} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Applied on {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))
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

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Briefcase } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  isAdmin?: boolean;
  hasApplied?: boolean;
}

export default function JobCard({ job, onApply, onViewApplications, isAdmin, hasApplied }: JobCardProps) {
  const deadline = new Date(job.deadline);
  const isExpired = deadline < new Date();
  
  return (
    <Card 
      className="hover-elevate transition-all duration-300 h-full flex flex-col"
      data-testid={`job-card-${job.id}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold truncate" data-testid={`job-title-${job.id}`}>
              {job.title}
            </h3>
          </div>
          {hasApplied && (
            <Badge variant="secondary" data-testid={`badge-applied-${job.id}`}>
              Applied
            </Badge>
          )}
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className={isExpired ? "text-destructive" : ""}>
              Deadline: {deadline.toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {job.requirements.split(',').slice(0, 3).map((req, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {req.trim()}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        {isAdmin ? (
          <Button 
            className="w-full"
            onClick={() => onViewApplications?.(job.id)}
            data-testid={`button-view-applications-${job.id}`}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            View Applications
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={() => onApply?.(job.id)}
            disabled={isExpired || hasApplied}
            data-testid={`button-apply-${job.id}`}
          >
            {hasApplied ? "Already Applied" : isExpired ? "Expired" : "Apply Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

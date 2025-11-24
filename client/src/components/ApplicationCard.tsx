import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "./StatusBadge";
import { Mail, Calendar } from "lucide-react";
import type { Application, User } from "@shared/schema";

interface ApplicationCardProps {
  application: Application & { student?: User };
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  showActions?: boolean;
}

export default function ApplicationCard({ 
  application, 
  onAccept, 
  onDecline,
  showActions = true 
}: ApplicationCardProps) {
  const initials = application.student?.name
    ? application.student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

  const isPending = application.status === "pending";

  return (
    <Card data-testid={`application-card-${application.id}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate" data-testid={`applicant-name-${application.id}`}>
                  {application.student?.name || "Unknown Student"}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{application.student?.email || "No email"}</span>
                </div>
              </div>
              <StatusBadge status={application.status as any} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Applied on {new Date(application.appliedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>

      {showActions && isPending && (
        <CardFooter className="gap-2 flex-wrap">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => onAccept?.(application.id)}
            data-testid={`button-accept-${application.id}`}
          >
            Accept
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onDecline?.(application.id)}
            data-testid={`button-decline-${application.id}`}
          >
            Decline
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Mail } from "lucide-react";

interface StatusBadgeProps {
  status: "pending" | "accepted" | "declined" | "sent";
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary" as const,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    accepted: {
      icon: CheckCircle,
      label: "Accepted",
      variant: "secondary" as const,
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    declined: {
      icon: XCircle,
      label: "Declined",
      variant: "secondary" as const,
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    },
    sent: {
      icon: Mail,
      label: "Sent",
      variant: "secondary" as const,
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
      data-testid={`status-badge-${status}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

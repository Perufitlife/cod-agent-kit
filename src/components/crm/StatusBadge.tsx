import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { variant: string; className: string }> = {
    pending: { variant: "outline", className: "border-warning bg-warning/10 text-warning hover:bg-warning/20" },
    confirmed: { variant: "default", className: "bg-success text-success-foreground hover:bg-success/90" },
    shipped: { variant: "secondary", className: "bg-primary/10 text-primary border-primary/20" },
    delivered: { variant: "default", className: "bg-success text-success-foreground hover:bg-success/90" },
    cancelled: { variant: "destructive", className: "" },
    awaiting_customer_contact: { variant: "outline", className: "border-muted-foreground bg-muted text-muted-foreground" },
    running: { variant: "default", className: "bg-primary text-primary-foreground hover:bg-primary/90" },
    completed: { variant: "default", className: "bg-success text-success-foreground hover:bg-success/90" },
    failed: { variant: "destructive", className: "" },
    paused: { variant: "outline", className: "border-muted-foreground bg-muted text-muted-foreground" },
    active: { variant: "default", className: "bg-success text-success-foreground hover:bg-success/90" },
    closed: { variant: "outline", className: "border-muted-foreground bg-muted text-muted-foreground" },
    scheduled: { variant: "outline", className: "border-primary bg-primary/10 text-primary" },
    fired: { variant: "default", className: "bg-success text-success-foreground hover:bg-success/90" },
  };

  return configs[status.toLowerCase()] || { variant: "outline", className: "" };
};

export const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const config = getStatusConfig(status);
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge 
      variant={variant || config.variant as any}
      className={cn(config.className, "font-medium")}
    >
      {displayStatus}
    </Badge>
  );
};
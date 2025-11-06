import { Badge } from "@/components/ui/badge";
import { ApplicationStatus } from "@/types";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      variant: 'bg-warning/10 text-warning border-warning/20',
      icon: <Clock className="h-3 w-3" />
    },
    library_verified: {
      label: 'Library Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    hostel_verification_pending: {
      label: 'Hostel Verification Pending',
      variant: 'bg-warning/10 text-warning border-warning/20',
      icon: <Clock className="h-3 w-3" />
    },
    hostel_verified: {
      label: 'Hostel Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    college_office_verification_pending: {
      label: 'Office Verification Pending',
      variant: 'bg-warning/10 text-warning border-warning/20',
      icon: <Clock className="h-3 w-3" />
    },
    college_office_verified: {
      label: 'Office Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    faculty_verified: {
      label: 'Faculty Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    hod_verified: {
      label: 'HOD Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    payment_pending: {
      label: 'Payment Pending',
      variant: 'bg-warning/10 text-warning border-warning/20',
      icon: <AlertCircle className="h-3 w-3" />
    },
    lab_verified: {
      label: 'Lab Verified',
      variant: 'bg-success/10 text-success border-success/20',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    completed: {
      label: 'Completed',
      variant: 'bg-success text-success-foreground',
      icon: <CheckCircle2 className="h-3 w-3" />
    },
    rejected: {
      label: 'Rejected',
      variant: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: <XCircle className="h-3 w-3" />
    }
  };

  const config = statusConfig[status] || {
    label: status || 'Unknown',
    variant: 'bg-muted/10 text-muted-foreground border-muted/20',
    icon: <AlertCircle className="h-3 w-3" />
  };

  return (
    <Badge className={`${config.variant} flex items-center gap-1 px-2 py-1`} variant="outline">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;

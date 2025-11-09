import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, User } from "lucide-react";
import { useState } from "react";

interface ApplicationDetailModalProps {
  application: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
  processing: boolean;
}

export default function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  processing,
}: ApplicationDetailModalProps) {
  const [comment, setComment] = useState("");

  if (!application) return null;

  const handleApprove = () => {
    onApprove(application.id, comment);
    setComment("");
  };

  const handleReject = () => {
    onReject(application.id, comment);
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Review student information and verification status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Student Information</h3>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={application.profiles?.photo} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 flex-1">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{application.profiles?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">USN</p>
                  <p className="font-medium font-mono">{application.profiles?.usn}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{application.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">{application.semester}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student Type</p>
                  <Badge variant="outline">
                    {application.profiles?.student_type === 'hostel' ? 'Hostel' : 'Local'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Verification Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {application.library_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={application.library_verified ? "text-success" : "text-muted-foreground"}>
                  Library Verification
                </span>
              </div>
              {application.profiles?.student_type === 'hostel' && (
                <div className="flex items-center gap-2">
                  {application.hostel_verified ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={application.hostel_verified ? "text-success" : "text-muted-foreground"}>
                    Hostel Verification
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {application.college_office_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={application.college_office_verified ? "text-success" : "text-muted-foreground"}>
                  College Office Verification
                </span>
              </div>
              <div className="flex items-center gap-2">
                {application.faculty_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={application.faculty_verified ? "text-success" : "text-muted-foreground"}>
                  Faculty Verification
                </span>
              </div>
              <div className="flex items-center gap-2">
                {application.counsellor_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={application.counsellor_verified ? "text-success" : "text-muted-foreground"}>
                  Counsellor Verification
                </span>
              </div>
              <div className="flex items-center gap-2">
                {application.class_advisor_verified ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={application.class_advisor_verified ? "text-success" : "text-muted-foreground"}>
                  Class Advisor Verification
                </span>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter any comments or notes..."
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setComment("");
                  onClose();
                }}
                disabled={processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

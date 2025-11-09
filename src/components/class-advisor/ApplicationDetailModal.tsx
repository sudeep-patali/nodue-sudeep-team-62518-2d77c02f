import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApplicationDetailModalProps {
  application: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ApplicationDetailModal({
  application,
  open,
  onClose,
  onUpdate,
}: ApplicationDetailModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [comment, setComment] = useState("");

  const student = application?.profiles;

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      
      const { error } = await supabase
        .from("applications")
        .update({
          class_advisor_verified: true,
          class_advisor_verified_at: new Date().toISOString(),
          status: "class_advisor_verified",
        })
        .eq("id", application.id);

      if (error) throw error;

      // Notify HOD of the student's department
      const { data: hodStaff } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('department', student.department)
        .eq('designation', 'HOD')
        .eq('is_active', true)
        .single();

      if (hodStaff) {
        await supabase.from('notifications').insert({
          user_id: hodStaff.id,
          title: 'Application Ready for HOD Verification',
          message: `${student.name} (${student.usn}) from ${student.department} - Semester ${student.semester} has been verified by all faculty, counsellor, and class advisor. Ready for final HOD verification.`,
          type: 'info',
          related_entity_type: 'application',
          related_entity_id: application.id
        });
      }

      toast.success("Application approved! HOD has been notified.");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error approving application:", error);
      toast.error("Failed to approve application");
    } finally {
      setIsApproving(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setIsRejecting(true);

      const { error } = await supabase
        .from("applications")
        .update({
          class_advisor_verified: false,
          class_advisor_comment: comment,
          status: "rejected",
        })
        .eq("id", application.id);

      if (error) throw error;

      toast.success("Application rejected. Student has been notified.");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Failed to reject application");
    } finally {
      setIsRejecting(false);
      setShowRejectForm(false);
    }
  };

  if (!application || !student) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {showRejectForm ? (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Rejection Reason</h3>
                <Textarea
                  placeholder="Please provide detailed reason for rejection..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Student will receive this message and must meet with you to resolve.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting || !comment.trim()}
                  className="flex-1"
                >
                  {isRejecting ? "Submitting..." : "Submit Rejection"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setComment("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={student.photo} />
                    <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{student.name}</h3>
                    <p className="text-muted-foreground">{student.usn}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{student.department}</Badge>
                      <Badge variant="outline">Semester {student.semester}</Badge>
                      {student.section && (
                        <Badge variant="outline">Section {student.section}</Badge>
                      )}
                      <Badge variant="secondary">{student.student_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${student.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {student.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Verification Timeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Library Verification</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    {application.hostel_verified && (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Hostel Verification</p>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">College Office Verification</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Faculty Approvals</p>
                        <p className="text-sm text-muted-foreground">All faculty verified</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Counsellor Verification</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-teal-50 dark:bg-teal-950 p-3 rounded-lg">
                      <div className="h-5 w-5 rounded-full bg-teal-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Class Advisor Verification</p>
                        <p className="text-sm text-muted-foreground">Awaiting your approval</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 opacity-50">
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">HOD Verification</p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isApproving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this application? It will be sent to the HOD for
              final departmental verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving ? "Approving..." : "Yes, Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

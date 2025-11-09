import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Mail, Phone, Building2, Hash } from "lucide-react";
import { useState } from "react";
import VerificationStatusBadge from "./VerificationStatusBadge";

interface ApplicationDetailModalProps {
  application: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  processing: boolean;
}

export default function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  processing
}: ApplicationDetailModalProps) {
  const [comment, setComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onApprove(comment);
    setComment("");
    setShowRejectForm(false);
  };

  const handleReject = () => {
    if (!comment.trim()) {
      alert("Comment is required for rejection");
      return;
    }
    onReject(comment);
    setComment("");
    setShowRejectForm(false);
  };

  const handleCancel = () => {
    setComment("");
    setShowRejectForm(false);
    onClose();
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Review student information and take action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-foreground">Student Information</h3>
            <div className="flex gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={application.profiles?.photo} alt={application.profiles?.name} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {application.profiles?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{application.profiles?.name}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{application.profiles?.usn}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{application.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>Semester {application.semester}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{application.profiles?.email}</span>
                  </div>
                  {application.profiles?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{application.profiles?.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-foreground">Verification Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <VerificationStatusBadge verified={application.college_office_verified} label="College Office" />
              <VerificationStatusBadge verified={application.library_verified} label="Library" />
              <VerificationStatusBadge verified={application.hostel_verified} label="Hostel" />
              <VerificationStatusBadge verified={application.lab_verified} label="Lab" />
              <VerificationStatusBadge verified={application.faculty_verified} label="Faculty" />
              <VerificationStatusBadge verified={application.counsellor_verified} label="Counsellor" />
              <VerificationStatusBadge verified={application.class_advisor_verified} label="Class Advisor" />
              <VerificationStatusBadge verified={application.hod_verified} label="HOD" />
            </div>
          </div>

          {/* Application Details */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4 text-foreground">Application Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Batch:</span>
                <span className="ml-2 font-medium text-foreground">{application.batch}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2">
                  <Badge variant={
                    application.status === 'approved' ? 'default' :
                    application.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {application.status}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Submitted:</span>
                <span className="ml-2 font-medium text-foreground">
                  {new Date(application.created_at).toLocaleString()}
                </span>
              </div>
              {application.transaction_id && (
                <div>
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="ml-2 font-medium text-foreground font-mono">{application.transaction_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Previous Comments */}
          {(application.faculty_comment || application.college_office_comment || application.hod_comment) && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-foreground">Comments</h3>
              <div className="space-y-2 text-sm">
                {application.college_office_comment && (
                  <div>
                    <span className="font-medium text-muted-foreground">College Office: </span>
                    <span className="text-foreground">{application.college_office_comment}</span>
                  </div>
                )}
                {application.faculty_comment && (
                  <div>
                    <span className="font-medium text-muted-foreground">Faculty: </span>
                    <span className="text-foreground">{application.faculty_comment}</span>
                  </div>
                )}
                {application.hod_comment && (
                  <div>
                    <span className="font-medium text-muted-foreground">HOD: </span>
                    <span className="text-foreground">{application.hod_comment}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Section */}
          {!application.faculty_verified && application.status !== 'rejected' && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Take Action</h3>
              
              {showRejectForm && (
                <div>
                  <label className="text-sm font-medium text-foreground">Rejection Comment (Required)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}

              {!showRejectForm && (
                <div>
                  <label className="text-sm font-medium text-foreground">Comment (Optional)</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add any comments..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!showRejectForm ? (
                  <>
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
                      onClick={() => setShowRejectForm(true)}
                      disabled={processing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={processing || !comment.trim()}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Confirm Rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setComment("");
                      }}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {application.status === 'rejected' && !application.faculty_verified && (
            <div className="border rounded-lg p-4 space-y-4 bg-destructive/5">
              <h3 className="font-semibold text-foreground">Application Rejected</h3>
              <p className="text-sm text-muted-foreground">
                This application was previously rejected. You can approve it if the issues have been resolved.
              </p>
              
              <div>
                <label className="text-sm font-medium text-foreground">Comment (Optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any comments about the approval..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleApprove}
                disabled={processing}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={processing}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

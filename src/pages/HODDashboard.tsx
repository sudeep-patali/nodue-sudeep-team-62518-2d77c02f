import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Shield, Info } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";

export default function HODDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [profile]);

  const fetchApplications = async () => {
    if (!profile?.department) {
      setLoading(false);
      return;
    }

    try {
      // Fetch applications from the HOD's department that have faculty verification completed
      const { data, error } = await (supabase as any)
        .from('applications')
        .select(`
          *,
          profiles:student_id (name, usn, email, department)
        `)
        .eq('faculty_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by department from the joined profiles table
      const departmentFiltered = (data || []).filter(
        app => app.profiles?.department === profile.department
      );

      setApplications(departmentFiltered);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (applicationId: string, approved: boolean) => {
    setProcessing(true);
    try {
      const updateData: any = {
        hod_verified: approved,
        hod_comment: comment || null,
        status: approved ? 'hod_verified' : 'rejected',
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Create notification for student
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: selectedApp.student_id,
          title: approved ? 'HOD Verification Approved' : 'Application Rejected by HOD',
          message: approved 
            ? `Your application has been verified by the HOD. You can now proceed to lab charge payment. ${comment || ''}` 
            : `Your application was rejected by HOD. Reason: ${comment || 'Not specified'}`,
          type: approved ? 'approval' : 'rejection',
          related_entity_type: 'application',
          related_entity_id: applicationId
        });

      // Notify Lab Instructor when HOD approves
      if (approved) {
        const { data: labInstructors } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'lab_instructor');

        if (labInstructors && labInstructors.length > 0) {
          // Get lab instructors from the same department
          const { data: deptLabInstructors } = await supabase
            .from('staff_profiles')
            .select('id')
            .eq('department', selectedApp.profiles.department)
            .in('id', labInstructors.map(li => li.user_id))
            .eq('is_active', true);

          if (deptLabInstructors && deptLabInstructors.length > 0) {
            const labNotifications = deptLabInstructors.map(instructor => ({
              user_id: instructor.id,
              title: 'Application Approved by HOD',
              message: `${selectedApp.profiles.name} (${selectedApp.profiles.usn}) from ${selectedApp.profiles.department} has been approved by HOD. Awaiting lab charge payment verification.`,
              type: 'info' as const,
              related_entity_type: 'application',
              related_entity_id: applicationId
            }));

            await supabase
              .from('notifications')
              .insert(labNotifications);
          }
        }
      }

      toast({
        title: "Success!",
        description: `Application ${approved ? 'approved' : 'rejected'} successfully`,
      });

      setComment("");
      setSelectedApp(null);
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => !a.hod_verified && a.status !== 'rejected').length,
    approved: applications.filter(a => a.hod_verified).length,
    rejected: applications.filter(a => a.status === 'rejected' && !a.hod_verified).length
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="HOD Dashboard" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Department: {profile?.department}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 bg-muted/50">
          <CardHeader>
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <CardTitle>HOD Verification Stage</CardTitle>
                <CardDescription className="mt-2">
                  These applications have been verified by faculty and are awaiting HOD approval. 
                  Your verification is the final departmental step before payment and lab charge verification.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications Pending HOD Approval</CardTitle>
            <CardDescription>Faculty-verified applications from {profile?.department} department</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : applications.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No applications pending</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Faculty Status</TableHead>
                    <TableHead>HOD Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.profiles?.name}</TableCell>
                      <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                      <TableCell>{app.semester}</TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Faculty Verified
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.hod_verified ? (
                          <Badge variant="default">Verified</Badge>
                        ) : app.status === 'rejected' ? (
                          <Badge variant="destructive">Rejected</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!app.hod_verified && app.status !== 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedApp && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>HOD Verification</CardTitle>
              <CardDescription>
                Student: {selectedApp.profiles?.name} ({selectedApp.profiles?.usn})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Verification Trail</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Library: {selectedApp.library_verified ? 'Verified' : 'Pending'}</span>
                  </div>
                  {selectedApp.profiles?.student_type === 'hostel' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Hostel: {selectedApp.hostel_verified ? 'Verified' : 'Pending'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>College Office: {selectedApp.college_office_verified ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Faculty: Verified</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">HOD Comments (Optional)</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any final comments or instructions..."
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleVerification(selectedApp.id, true)}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve as HOD
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerification(selectedApp.id, false)}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApp(null);
                    setComment("");
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

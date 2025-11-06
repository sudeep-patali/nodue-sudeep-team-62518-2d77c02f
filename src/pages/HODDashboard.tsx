import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Shield, Info, GraduationCap, BookOpen } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import StaffProfileSummaryCard from "@/components/staff/StaffProfileSummaryCard";

type DashboardMode = 'teaching' | 'hod';

export default function HODDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  // Mode and filter states
  const [activeMode, setActiveMode] = useState<DashboardMode>('hod');
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Application states
  const [applications, setApplications] = useState<any[]>([]);
  const [teachingApplications, setTeachingApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
    
    // Real-time subscription
    const channel = supabase
      .channel('hod-applications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'applications'
      }, () => {
        fetchApplications();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [profile, activeMode, selectedSemester]);

  const fetchApplications = async () => {
    if (!profile?.department) {
      setLoading(false);
      return;
    }

    try {
      if (activeMode === 'teaching') {
        // Teaching Mode: Fetch applications where HOD is assigned as faculty
        const { data: facultyAssignments, error } = await supabase
          .from('application_subject_faculty')
          .select(`
            *,
            applications:application_id(*,profiles:student_id(*)),
            subjects:subject_id(*)
          `)
          .eq('faculty_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const filteredTeaching = (facultyAssignments || []).filter(assignment => {
          const app = assignment.applications;
          return app?.college_office_verified === true && 
                 (selectedSemester === 'all' || app?.semester?.toString() === selectedSemester);
        });

        setTeachingApplications(filteredTeaching);
      } else {
        // HOD Mode: Fetch applications ready for HOD verification
        let query = supabase
          .from('applications')
          .select(`
            *,
            profiles:student_id (name, usn, email, department, student_type)
          `)
          .eq('faculty_verified', true)
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Filter by department and semester
        let filtered = (data || []).filter(
          app => app.profiles?.department === profile.department
        );

        if (selectedSemester !== 'all') {
          filtered = filtered.filter(app => app.semester?.toString() === selectedSemester);
        }

        setApplications(filtered);
      }
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

  const handleTeachingVerification = async (assignmentId: string, verified: boolean) => {
    setProcessing(true);
    try {
      const updateData = {
        faculty_verified: verified,
        faculty_comment: comment || null,
        verified_at: verified ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('application_subject_faculty')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Subject verification ${verified ? 'approved' : 'rejected'}`,
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

  const handleHODVerification = async (applicationId: string, approved: boolean) => {
    setProcessing(true);
    try {
      const updateData: any = {
        hod_verified: approved,
        hod_comment: comment || null,
        status: approved ? 'hod_verified' : 'rejected',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Create notification for student
      await supabase
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

            await supabase.from('notifications').insert(labNotifications);
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

  // HOD Mode Stats
  const hodStats = {
    total: applications.length,
    pending: applications.filter(a => !a.hod_verified && a.status !== 'rejected').length,
    approved: applications.filter(a => a.hod_verified).length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  // Teaching Mode Stats
  const teachingStats = {
    total: teachingApplications.length,
    pending: teachingApplications.filter(a => !a.faculty_verified).length,
    approved: teachingApplications.filter(a => a.faculty_verified).length
  };

  const currentApps = activeMode === 'teaching' ? teachingApplications : applications;
  const stats = activeMode === 'teaching' ? teachingStats : hodStats;

  // Filter applications by tab
  const getFilteredApps = () => {
    if (activeMode === 'teaching') {
      if (activeTab === 'pending') return teachingApplications.filter(a => !a.faculty_verified);
      if (activeTab === 'approved') return teachingApplications.filter(a => a.faculty_verified);
      return [];
    } else {
      if (activeTab === 'pending') return applications.filter(a => !a.hod_verified && a.status !== 'rejected');
      if (activeTab === 'approved') return applications.filter(a => a.hod_verified);
      if (activeTab === 'rejected') return applications.filter(a => a.status === 'rejected');
      return [];
    }
  };

  const filteredApps = getFilteredApps();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="HOD Dashboard" />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Profile Summary */}
        {profile && (
          <StaffProfileSummaryCard 
            profile={profile} 
            role="Head of Department"
            basePath="/hod"
          />
        )}

        {/* Mode Toggle */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Select Your Mode</h3>
                <p className="text-sm text-muted-foreground">
                  {activeMode === 'teaching' 
                    ? "Verify subjects you teach as a faculty member"
                    : "Approve applications as department head (final departmental verification)"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={activeMode === 'teaching' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveMode('teaching');
                    setActiveTab('pending');
                  }}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Teaching Mode
                </Button>
                <Button
                  variant={activeMode === 'hod' ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveMode('hod');
                    setActiveTab('pending');
                  }}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  HOD Mode
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <label className="text-sm font-medium">Filter by Semester</label>
                <p className="text-xs text-muted-foreground">View applications from specific semester</p>
              </div>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="3">Semester 3</SelectItem>
                  <SelectItem value="4">Semester 4</SelectItem>
                  <SelectItem value="5">Semester 5</SelectItem>
                  <SelectItem value="6">Semester 6</SelectItem>
                  <SelectItem value="7">Semester 7</SelectItem>
                  <SelectItem value="8">Semester 8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {activeMode === 'teaching' ? 'Assigned to you' : `Department: ${profile?.department}`}
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

          {activeMode === 'hod' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hodStats.rejected}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <CardTitle>
                  {activeMode === 'teaching' ? 'Teaching Mode' : 'HOD Verification Stage'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {activeMode === 'teaching' 
                    ? 'Verify subjects assigned to you. This works the same as faculty verification for your teaching assignments.'
                    : 'These applications have been verified by faculty and are awaiting HOD approval. Your verification is the final departmental step before payment and lab charge verification.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Applications Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeMode === 'teaching' ? 'Teaching Assignments' : 'HOD Applications'}
            </CardTitle>
            <CardDescription>
              {activeMode === 'teaching' 
                ? 'Applications where you are assigned as faculty'
                : `Faculty-verified applications from ${profile?.department} department`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full ${activeMode === 'hod' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approved ({stats.approved})
                </TabsTrigger>
                {activeMode === 'hod' && (
                  <TabsTrigger value="rejected" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Rejected ({hodStats.rejected})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : filteredApps.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No applications in this category</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Semester</TableHead>
                        {activeMode === 'teaching' && <TableHead>Subject</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.map((item) => {
                        const app = activeMode === 'teaching' ? item.applications : item;
                        const profile = app.profiles || app.student_profile;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{profile?.name}</TableCell>
                            <TableCell className="font-mono text-sm">{profile?.usn}</TableCell>
                            <TableCell>{app.semester}</TableCell>
                            {activeMode === 'teaching' && (
                              <TableCell className="text-sm">
                                {item.subjects?.name}
                                <br />
                                <span className="text-xs text-muted-foreground">{item.subjects?.code}</span>
                              </TableCell>
                            )}
                            <TableCell>
                              {activeMode === 'teaching' ? (
                                item.faculty_verified ? (
                                  <Badge variant="default">Verified</Badge>
                                ) : (
                                  <Badge variant="secondary">Pending</Badge>
                                )
                              ) : (
                                app.hod_verified ? (
                                  <Badge variant="default">Approved</Badge>
                                ) : app.status === 'rejected' ? (
                                  <Badge variant="destructive">Rejected</Badge>
                                ) : (
                                  <Badge variant="secondary">Pending</Badge>
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {activeMode === 'teaching' ? (
                                !item.faculty_verified && (
                                  <Button size="sm" onClick={() => setSelectedApp(item)}>
                                    Review
                                  </Button>
                                )
                              ) : (
                                <>
                                  {activeTab === 'pending' && (
                                    <Button size="sm" onClick={() => setSelectedApp(item)}>
                                      Review
                                    </Button>
                                  )}
                                  {activeTab === 'rejected' && (
                                    <Button size="sm" variant="outline" onClick={() => setSelectedApp(item)}>
                                      Re-approve
                                    </Button>
                                  )}
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Review Modal */}
        {selectedApp && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>
                {activeMode === 'teaching' ? 'Subject Verification' : 
                 activeTab === 'rejected' ? 'Re-approve Application' : 'HOD Verification'}
              </CardTitle>
              <CardDescription>
                {activeMode === 'teaching' ? (
                  <>
                    Student: {selectedApp.applications?.profiles?.name} ({selectedApp.applications?.profiles?.usn})
                    <br />
                    Subject: {selectedApp.subjects?.name} ({selectedApp.subjects?.code})
                  </>
                ) : (
                  <>Student: {selectedApp.profiles?.name} ({selectedApp.profiles?.usn})</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeMode === 'hod' && (
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
                  {selectedApp.hod_comment && activeTab === 'rejected' && (
                    <div className="mt-3 p-2 bg-destructive/10 rounded border border-destructive/20">
                      <p className="text-xs font-medium text-destructive">Previous Rejection Reason:</p>
                      <p className="text-sm mt-1">{selectedApp.hod_comment}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium">
                  {activeMode === 'teaching' ? 'Faculty Comments (Optional)' : 'HOD Comments (Optional)'}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={activeMode === 'teaching' 
                    ? "Add any comments about subject verification..." 
                    : activeTab === 'rejected'
                    ? "Add comments about re-approval..."
                    : "Add any final comments or instructions..."}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                {activeMode === 'teaching' ? (
                  <>
                    <Button
                      onClick={() => handleTeachingVerification(selectedApp.id, true)}
                      disabled={processing}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Subject
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleTeachingVerification(selectedApp.id, false)}
                      disabled={processing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                ) : activeTab === 'rejected' ? (
                  <Button
                    onClick={() => handleHODVerification(selectedApp.id, true)}
                    disabled={processing}
                    className="flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Re-approve Application
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleHODVerification(selectedApp.id, true)}
                      disabled={processing}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve as HOD
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleHODVerification(selectedApp.id, false)}
                      disabled={processing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
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

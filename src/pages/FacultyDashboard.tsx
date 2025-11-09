import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, GraduationCap, Filter } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import FacultyProfileCard from "@/components/faculty/FacultyProfileCard";
import ApplicationDetailModal from "@/components/faculty/ApplicationDetailModal";
import FacultyProfileView from "@/components/faculty/FacultyProfileView";
import FacultyProfileEdit from "@/components/faculty/FacultyProfileEdit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FacultyDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchStaffProfile();
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    filterApplications();
  }, [applications, selectedDepartment, selectedSemester, activeTab]);

  const fetchStaffProfile = async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('staff_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching staff profile:', error);
    } else {
      setStaffProfile(data);
    }
  };

  const fetchApplications = async () => {
    if (!user?.id) return;

    try {
      // Fetch ALL applications where the current faculty member was selected
      const { data, error } = await (supabase as any)
        .from('application_subject_faculty')
        .select(`
          id,
          application_id,
          subject_id,
          faculty_verified,
          faculty_comment,
          verified_at,
          subjects:subject_id(name, code),
          applications:application_id(
            *,
            profiles:student_id(name, usn, email, phone, photo, section, student_type, department, semester, batch)
          )
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter for college office verified applications only
      const filtered = (data || []).filter(assignment => 
        assignment.applications?.college_office_verified === true
      );

      // Group by application ID to show one row per application
      const applicationMap = new Map();
      filtered.forEach(assignment => {
        const appId = assignment.application_id;
        if (!applicationMap.has(appId)) {
          applicationMap.set(appId, {
            ...assignment.applications,
            faculty_assignments: []
          });
        }
        applicationMap.get(appId).faculty_assignments.push({
          id: assignment.id,
          subject_id: assignment.subject_id,
          subject_name: assignment.subjects?.name,
          subject_code: assignment.subjects?.code,
          faculty_verified: assignment.faculty_verified,
          faculty_comment: assignment.faculty_comment,
          verified_at: assignment.verified_at
        });
      });

      setApplications(Array.from(applicationMap.values()));
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

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by department
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(app => app.profiles?.department === selectedDepartment);
    }

    // Filter by semester
    if (selectedSemester !== "all") {
      filtered = filtered.filter(app => app.profiles?.semester === parseInt(selectedSemester));
    }

    // Filter by tab - check if ALL faculty assignments are verified
    if (activeTab === "pending") {
      filtered = filtered.filter(app => {
        const allVerified = app.faculty_assignments?.every(a => a.faculty_verified);
        return !allVerified && app.status !== 'rejected';
      });
    } else if (activeTab === "approved") {
      filtered = filtered.filter(app => {
        const allVerified = app.faculty_assignments?.every(a => a.faculty_verified);
        return allVerified;
      });
    } else if (activeTab === "rejected") {
      filtered = filtered.filter(app => app.status === 'rejected');
    }

    setFilteredApplications(filtered);
  };

  const handleVerification = async (applicationId: string, approved: boolean, comment: string) => {
    setProcessing(true);
    try {
      // Update all faculty assignments for this application and current faculty
      const assignmentsToUpdate = selectedApp.faculty_assignments.map(a => a.id);
      
      const { error: updateError } = await (supabase as any)
        .from('application_subject_faculty')
        .update({
          faculty_verified: approved,
          verification_status: approved ? 'approved' : 'rejected',
          faculty_comment: comment || null,
          verified_at: approved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .in('id', assignmentsToUpdate);

      if (updateError) throw updateError;

      // Check if ALL faculty members have verified this application
      const { data: allAssignments, error: checkError } = await supabase
        .from('application_subject_faculty')
        .select('faculty_verified')
        .eq('application_id', applicationId);

      if (checkError) throw checkError;

      const allVerified = allAssignments?.every(a => a.faculty_verified === true);

      // If all faculty have verified OR if rejected, update the main application
      if (allVerified || !approved) {
        const { error: appError } = await (supabase as any)
          .from('applications')
          .update({
            faculty_verified: approved && allVerified,
            faculty_comment: comment || null,
            status: !approved ? 'rejected' : (allVerified ? 'faculty_verified' : 'college_office_verified'),
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (appError) throw appError;

        // Only notify if all verified or rejected
        const notificationMessage = !approved 
          ? `Your application was rejected by faculty. Reason: ${comment || 'Not specified'}`
          : allVerified 
            ? `All faculty members have verified your subjects. Your application is now proceeding to HOD verification. ${comment || ''}`
            : `Faculty verification in progress. ${comment || ''}`;

        await (supabase as any)
          .from('notifications')
          .insert({
            user_id: selectedApp.student_id,
            title: !approved ? 'Application Rejected' : allVerified ? 'All Faculty Verified' : 'Faculty Verification Update',
            message: notificationMessage,
            type: !approved ? 'rejection' : 'approval',
            related_entity_type: 'application',
            related_entity_id: applicationId
          });

        // Notify assigned counsellor when all faculty have verified
        if (approved && allVerified) {
          const { data: appData } = await supabase
            .from('applications')
            .select('counsellor_id')
            .eq('id', applicationId)
            .single();

          if (appData?.counsellor_id) {
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: appData.counsellor_id,
                title: 'Application Ready for Counsellor Verification',
                message: `${selectedApp.profiles.name} (${selectedApp.profiles.usn}) from ${selectedApp.department} - Semester ${selectedApp.profiles.semester} has been verified by all faculty members and is ready for your counsellor verification.`,
                type: 'info' as const,
                related_entity_type: 'application',
                related_entity_id: applicationId
              });

            if (notificationError) {
              console.error('Failed to notify counsellor:', notificationError);
            }
          }
        }
      } else {
        // Partial verification notification
        await (supabase as any)
          .from('notifications')
          .insert({
            user_id: selectedApp.student_id,
            title: 'Subject Verification Completed',
            message: `${staffProfile?.name || 'A faculty member'} has verified your subjects. Waiting for other faculty verifications. ${comment || ''}`,
            type: 'info',
            related_entity_type: 'application',
            related_entity_id: applicationId
          });
      }

      toast({
        title: "Success!",
        description: `Subjects ${approved ? 'verified' : 'rejected'} successfully`,
      });

      setShowDetailModal(false);
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
    pending: applications.filter(a => {
      const allVerified = a.faculty_assignments?.every(fa => fa.faculty_verified);
      return !allVerified && a.status !== 'rejected';
    }).length,
    approved: applications.filter(a => {
      const allVerified = a.faculty_assignments?.every(fa => fa.faculty_verified);
      return allVerified;
    }).length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const departments = ["CSE", "ISE", "ECE", "EEE", "MECH", "CIVIL"];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading || !staffProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={{ ...profile, role: profile?.designation || 'Faculty' }} title="Faculty Dashboard" />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <FacultyProfileCard 
          profile={staffProfile}
          onViewProfile={() => setShowProfileView(true)}
          onEditProfile={() => setShowProfileEdit(true)}
        />

        {/* Statistics Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Semester</label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedDepartment("all");
                    setSelectedSemester("all");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Manage no-due certificate applications</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({stats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({stats.rejected})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                {filteredApplications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No pending applications</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={app.profiles?.photo} />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {app.profiles?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{app.profiles?.name}</span>
                            </div>
                          </TableCell>
                           <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                          <TableCell>{app.profiles?.department}</TableCell>
                          <TableCell>{app.profiles?.semester}</TableCell>
                          <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app);
                                setShowDetailModal(true);
                              }}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                {filteredApplications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No approved applications</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Approved On</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={app.profiles?.photo} />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {app.profiles?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{app.profiles?.name}</span>
                            </div>
                          </TableCell>
                           <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                          <TableCell>{app.profiles?.department}</TableCell>
                          <TableCell>{app.profiles?.semester}</TableCell>
                          <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(app);
                                setShowDetailModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                {filteredApplications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No rejected applications</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Rejected On</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={app.profiles?.photo} />
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {app.profiles?.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{app.profiles?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                          <TableCell>{app.department}</TableCell>
                          <TableCell>{app.semester}</TableCell>
                          <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApp(app);
                                setShowDetailModal(true);
                              }}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <ApplicationDetailModal
        application={selectedApp}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedApp(null);
        }}
        onApprove={(comment) => handleVerification(selectedApp.id, true, comment)}
        onReject={(comment) => handleVerification(selectedApp.id, false, comment)}
        processing={processing}
      />

      <FacultyProfileView
        profile={staffProfile}
        stats={stats}
        isOpen={showProfileView}
        onClose={() => setShowProfileView(false)}
      />

      <FacultyProfileEdit
        profile={staffProfile}
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onUpdate={fetchStaffProfile}
      />
    </div>
  );
}

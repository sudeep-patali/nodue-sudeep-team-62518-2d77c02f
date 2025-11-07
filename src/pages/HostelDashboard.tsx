import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Home } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import StaffProfileSummaryCard from "@/components/staff/StaffProfileSummaryCard";
import ApplicationDetailModal from "@/components/staff/ApplicationDetailModal";

export default function HostelDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchStaffProfile();
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedDepartment, selectedSemester, applications]);

  const fetchStaffProfile = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setStaffProfile(data);
    }
  };

  const applyFilters = () => {
    let filtered = hostelStudents;
    
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(app => app.department === selectedDepartment);
    }
    
    if (selectedSemester !== "all") {
      filtered = filtered.filter(app => app.semester === parseInt(selectedSemester));
    }
    
    setFilteredApps(filtered);
  };

  const fetchApplications = async () => {
    const { data, error } = await (supabase as any)
      .from('applications')
      .select(`
        *,
        profiles:student_id (name, usn, email, student_type, photo, section, department)
      `)
      .eq('profiles.student_type', 'hostel')
      .in('status', ['hostel_verification_pending', 'hostel_verified', 'rejected'])
      .eq('library_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleVerification = async (applicationId: string, comment: string, approved: boolean) => {
    setProcessing(true);
    try {
      const nextStatus = approved ? 'college_office_verification_pending' : 'rejected';
      
      const { error } = await (supabase as any)
        .from('applications')
        .update({
          hostel_verified: approved,
          hostel_comment: comment || null,
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: selectedApp.student_id,
          title: approved ? 'Hostel Clearance Approved' : 'Hostel Clearance Rejected',
          message: approved 
            ? `Your hostel clearance has been approved. Your application has been sent to College Office for verification. ${comment || ''}` 
            : `Hostel clearance rejected. Reason: ${comment || 'Not specified'}. Please visit the hostel office to resolve.`,
          type: approved ? 'approval' : 'rejection',
          related_entity_type: 'application',
          related_entity_id: applicationId
        });

      // Notify College Office staff when hostel students are approved
      if (approved) {
        const { data: collegeOfficeStaff } = await supabase
          .rpc('get_users_by_role', { role_name: 'college_office' });

        if (collegeOfficeStaff && collegeOfficeStaff.length > 0) {
          const collegeOfficeNotifications = collegeOfficeStaff.map(staff => ({
            user_id: staff.user_id,
            title: 'New Application for Office Verification',
            message: `${selectedApp.profiles.name} (${selectedApp.profiles.usn}) from ${selectedApp.department} - Semester ${selectedApp.semester} has been approved by Hostel and requires College Office verification.`,
            type: 'info' as const,
            related_entity_type: 'application',
            related_entity_id: applicationId
          }));

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(collegeOfficeNotifications);

          if (notificationError) {
            console.error('Failed to notify college office staff:', notificationError);
          }
        }
      }

      toast({
        title: "Success!",
        description: `Application ${approved ? 'approved' : 'rejected'} successfully`,
      });

      setModalOpen(false);
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

  const hostelStudents = applications.filter(a => a.profiles?.student_type === 'hostel');
  const pendingApps = filteredApps.filter(a => a.status === 'hostel_verification_pending' && !a.hostel_verified);
  const approvedApps = filteredApps.filter(a => a.hostel_verified === true);
  const rejectedApps = filteredApps.filter(a => a.status === 'rejected' && !a.hostel_verified);
  
  const stats = {
    total: hostelStudents.length,
    pending: hostelStudents.filter(a => !a.hostel_verified && a.status !== 'rejected').length,
    approved: hostelStudents.filter(a => a.hostel_verified).length,
    rejected: hostelStudents.filter(a => a.status === 'rejected' && !a.hostel_verified).length
  };

  const departments = Array.from(new Set(applications.map(a => a.department))).filter(Boolean);
  const semesters = Array.from(new Set(applications.map(a => a.semester))).filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={staffProfile ? { ...staffProfile, role: 'Hostel Staff' } : user} 
        title="Hostel Dashboard" 
      />
      
      <main className="container mx-auto px-4 py-8">
        {staffProfile && (
          <div className="mb-6">
            <StaffProfileSummaryCard 
              profile={staffProfile}
              role="Hostel Staff"
              basePath="/hostel"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hostel Students</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hostel Clearance Requests</CardTitle>
            <CardDescription>Verify room clearance and hostel dues</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
                  <TabsTrigger value="approved">Approved ({approvedApps.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({rejectedApps.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {pendingApps.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No pending applications</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.profiles?.name}</TableCell>
                            <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                            <TableCell>{app.department}</TableCell>
                            <TableCell>{app.semester}</TableCell>
                            <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => { setSelectedApp(app); setModalOpen(true); }}>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="approved">
                  {approvedApps.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No approved applications</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Approved Date</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.profiles?.name}</TableCell>
                            <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                            <TableCell>{app.department}</TableCell>
                            <TableCell>{app.semester}</TableCell>
                            <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setModalOpen(true); }}>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="rejected">
                  {rejectedApps.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No rejected applications</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Rejected Date</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.profiles?.name}</TableCell>
                            <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                            <TableCell>{app.department}</TableCell>
                            <TableCell>{app.semester}</TableCell>
                            <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => { setSelectedApp(app); setModalOpen(true); }}>
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <ApplicationDetailModal
          application={selectedApp}
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedApp(null); }}
          onApprove={(id, comment) => handleVerification(id, comment, true)}
          onReject={(id, comment) => handleVerification(id, comment, false)}
          processing={processing}
        />
      </main>
    </div>
  );
}

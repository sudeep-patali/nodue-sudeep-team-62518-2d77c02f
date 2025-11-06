import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, BookOpen, Search, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StaffProfileSummaryCard from "@/components/staff/StaffProfileSummaryCard";
import ApplicationDetailModal from "@/components/staff/ApplicationDetailModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useToast } from "@/hooks/use-toast";

const DEPARTMENTS = ['MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function LibraryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
    fetchStaffProfile();
  }, []);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!selectedApp) {
        fetchApplications();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [selectedApp]);

  // Real-time subscription for new applications
  useEffect(() => {
    const channel = supabase
      .channel('library-applications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'applications'
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  useEffect(() => {
    applyFilters();
  }, [searchQuery, applications, departmentFilter, semesterFilter]);

  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.profiles?.usn?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter(app => app.department === departmentFilter);
    }

    // Semester filter
    if (semesterFilter !== "all") {
      filtered = filtered.filter(app => app.semester === parseInt(semesterFilter));
    }

    setFilteredApps(filtered);
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles!applications_student_id_fkey (name, usn, email, department, photo, student_type, section)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const handleVerification = async (applicationId: string, approved: boolean, comment: string) => {
    // Validate rejection comment is provided
    if (!approved && !comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const application = applications.find(app => app.id === applicationId);
      
      // Determine next status based on student type
      let nextStatus = 'rejected';
      let notificationMessage = '';
      
      if (approved) {
        const studentType = application?.profiles?.student_type;
        if (studentType === 'hostel') {
          nextStatus = 'hostel_verification_pending';
          notificationMessage = 'Your library clearance has been approved. Your application has been sent to Hostel for verification.';
        } else {
          nextStatus = 'college_office_verification_pending';
          notificationMessage = 'Your library clearance has been approved. Your application has been sent to College Office for verification.';
        }
        if (comment) {
          notificationMessage += ` Note: ${comment}`;
        }
      } else {
        notificationMessage = `Library clearance rejected. Reason: ${comment}. Please visit the library to resolve the issue.`;
      }

      const { error } = await (supabase as any)
        .from('applications')
        .update({
          library_verified: approved,
          library_comment: comment || null,
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Create notification
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: application.student_id,
          title: approved ? 'Library Clearance Approved' : 'Library Clearance Rejected',
          message: notificationMessage,
          type: approved ? 'approval' : 'rejection',
          related_entity_type: 'application',
          related_entity_id: applicationId
        });

      // Notify next verifier when approved
      if (approved) {
        if (application?.profiles?.student_type === 'hostel') {
          // Notify Hostel staff for hostel students
          const { data: hostelStaff } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'hostel');

          if (hostelStaff && hostelStaff.length > 0) {
            const hostelNotifications = hostelStaff.map(staff => ({
              user_id: staff.user_id,
              title: 'New Application for Hostel Verification',
              message: `${application.profiles.name} (${application.profiles.usn}) from ${application.department} - Semester ${application.semester} has been approved by Library and requires Hostel verification.`,
              type: 'info' as const,
              related_entity_type: 'application',
              related_entity_id: applicationId
            }));

            await supabase
              .from('notifications')
              .insert(hostelNotifications);
          }
        } else {
          // Notify College Office staff for local students
          const { data: collegeOfficeStaff } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'college_office');

          if (collegeOfficeStaff && collegeOfficeStaff.length > 0) {
            const collegeOfficeNotifications = collegeOfficeStaff.map(staff => ({
              user_id: staff.user_id,
              title: 'New Application for Office Verification',
              message: `${application.profiles.name} (${application.profiles.usn}) from ${application.department} - Semester ${application.semester} has been approved by Library and requires College Office verification.`,
              type: 'info' as const,
              related_entity_type: 'application',
              related_entity_id: applicationId
            }));

            await supabase
              .from('notifications')
              .insert(collegeOfficeNotifications);
          }
        }
      }

      toast({
        title: "Success!",
        description: `Application ${approved ? 'approved' : 'rejected'} successfully`,
      });

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

  const pendingApps = filteredApps.filter(a => a.status === 'pending' && !a.library_verified);
  const approvedApps = filteredApps.filter(a => a.library_verified === true);
  const rejectedApps = filteredApps.filter(a => a.status === 'rejected' && !a.library_verified);

  const stats = {
    total: filteredApps.length,
    pending: pendingApps.length,
    approved: approvedApps.length,
    rejected: rejectedApps.length
  };

  const renderApplicationTable = (apps: any[], showReapprove: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Photo</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>USN</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.map((app) => (
          <TableRow key={app.id}>
            <TableCell>
              <Avatar className="h-8 w-8">
                <AvatarImage src={app.profiles?.photo} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{app.profiles?.name}</TableCell>
            <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
            <TableCell>{app.profiles?.department}</TableCell>
            <TableCell>{app.semester}</TableCell>
            <TableCell>{app.profiles?.section || 'N/A'}</TableCell>
            <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant={showReapprove ? "default" : "outline"}
                onClick={() => setSelectedApp(app)}
              >
                {showReapprove ? 'Re-approve' : 'Review'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={staffProfile ? { ...staffProfile, role: 'Library Staff' } : user} 
        title="Library Dashboard" 
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {staffProfile && (
              <StaffProfileSummaryCard 
                profile={staffProfile} 
                role="Library Staff" 
                basePath="/library" 
              />
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <CardTitle>Filter Applications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or USN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {SEMESTERS.map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Library Clearance Requests</CardTitle>
                <CardDescription>Verify book returns and library dues</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : (
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pending">
                        Pending ({pendingApps.length})
                      </TabsTrigger>
                      <TabsTrigger value="approved">
                        Approved ({approvedApps.length})
                      </TabsTrigger>
                      <TabsTrigger value="rejected">
                        Rejected ({rejectedApps.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending">
                      {pendingApps.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No pending applications</p>
                      ) : (
                        renderApplicationTable(pendingApps)
                      )}
                    </TabsContent>
                    <TabsContent value="approved">
                      {approvedApps.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No approved applications</p>
                      ) : (
                        renderApplicationTable(approvedApps)
                      )}
                    </TabsContent>
                    <TabsContent value="rejected">
                      {rejectedApps.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No rejected applications</p>
                      ) : (
                        renderApplicationTable(rejectedApps, true)
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <NotificationsPanel />
          </div>
        </div>
      </main>

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={(id, comment) => handleVerification(id, true, comment)}
          onReject={(id, comment) => handleVerification(id, false, comment)}
          processing={processing}
        />
      )}
    </div>
  );
}

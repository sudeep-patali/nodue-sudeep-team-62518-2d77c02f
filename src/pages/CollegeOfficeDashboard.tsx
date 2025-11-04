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
import { CheckCircle, XCircle, Clock, Building, Search } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import StaffProfileSummaryCard from "@/components/staff/StaffProfileSummaryCard";
import ApplicationDetailModal from "@/components/staff/ApplicationDetailModal";

export default function CollegeOfficeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  // Real-time subscription for application updates
  useEffect(() => {
    const channel = supabase
      .channel('college-office-applications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: 'status=eq.college_office_verification_pending'
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
  }, [searchQuery, selectedDepartment, selectedSemester, applications]);

  const applyFilters = () => {
    let filtered = applications;
    
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.profiles?.usn?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
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
        profiles:student_id (name, usn, email, department, student_type, photo, section)
      `)
      .in('status', ['college_office_verification_pending', 'college_office_verified', 'rejected'])
      .or('and(profiles.student_type.eq.hostel,hostel_verified.eq.true),and(profiles.student_type.eq.local,library_verified.eq.true)')
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
      const { error } = await (supabase as any)
        .from('applications')
        .update({
          college_office_verified: approved,
          college_office_comment: comment || null,
          status: approved ? 'college_office_verified' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: selectedApp.student_id,
          title: approved ? 'Office Verification Approved' : 'Office Verification Rejected',
          message: approved 
            ? `Your office clearance has been approved. ${comment || ''}` 
            : `Office verification rejected. Reason: ${comment || 'Not specified'}. Please visit the college office to resolve.`,
          type: approved ? 'approval' : 'rejection',
          related_entity_type: 'application',
          related_entity_id: applicationId
        });

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

  const handleBulkApprove = async () => {
    if (selectedApps.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select applications to approve",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const approvePromises = Array.from(selectedApps).map(appId =>
        (supabase as any)
          .from('applications')
          .update({
            college_office_verified: true,
            status: 'college_office_verified',
            updated_at: new Date().toISOString()
          })
          .eq('id', appId)
      );

      await Promise.all(approvePromises);

      toast({
        title: "Success!",
        description: `${selectedApps.size} applications approved`,
      });

      setSelectedApps(new Set());
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

  const pendingApps = filteredApps.filter(a => a.status === 'college_office_verification_pending' && !a.college_office_verified);
  const approvedApps = filteredApps.filter(a => a.college_office_verified === true);
  const rejectedApps = filteredApps.filter(a => a.status === 'rejected' && !a.college_office_verified);
  
  const stats = {
    total: applications.length,
    pending: applications.filter(a => !a.college_office_verified && a.status !== 'rejected').length,
    approved: applications.filter(a => a.college_office_verified).length,
    rejected: applications.filter(a => a.status === 'rejected' && !a.college_office_verified).length
  };

  const departments = Array.from(new Set(applications.map(a => a.department))).filter(Boolean);
  const semesters = Array.from(new Set(applications.map(a => a.semester))).filter(Boolean).sort();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={staffProfile ? { ...staffProfile, role: 'College Office Staff' } : user} 
        title="College Office Dashboard" 
      />
      
      <main className="container mx-auto px-4 py-8">
        {staffProfile && (
          <div className="mb-6">
            <StaffProfileSummaryCard 
              profile={staffProfile}
              role="College Office Staff"
              basePath="/college-office"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Filter Applications</CardTitle>
              </div>
              {selectedApps.size > 0 && (
                <Button onClick={handleBulkApprove} disabled={processing}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Selected ({selectedApps.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or USN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Office Verification Requests</CardTitle>
            <CardDescription>Verify administrative dues and documents</CardDescription>
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
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedApps(new Set(pendingApps.map(a => a.id)));
                                } else {
                                  setSelectedApps(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>USN</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingApps.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedApps.has(app.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedApps);
                                  if (e.target.checked) {
                                    newSet.add(app.id);
                                  } else {
                                    newSet.delete(app.id);
                                  }
                                  setSelectedApps(newSet);
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{app.profiles?.name}</TableCell>
                            <TableCell className="font-mono text-sm">{app.profiles?.usn}</TableCell>
                            <TableCell>{app.department}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {app.profiles?.student_type === 'hostel' ? 'Hostel' : 'Local'}
                              </Badge>
                            </TableCell>
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
                          <TableHead>Type</TableHead>
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
                            <TableCell>
                              <Badge variant="outline">
                                {app.profiles?.student_type === 'hostel' ? 'Hostel' : 'Local'}
                              </Badge>
                            </TableCell>
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
                          <TableHead>Type</TableHead>
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
                            <TableCell>
                              <Badge variant="outline">
                                {app.profiles?.student_type === 'hostel' ? 'Hostel' : 'Local'}
                              </Badge>
                            </TableCell>
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

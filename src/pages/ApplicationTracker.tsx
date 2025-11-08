import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Eye, FileText, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/lib/supabase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const ApplicationTracker = () => {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const departments = ['MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD'];

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch && selectedDepartment) {
      fetchApplications();
    }
  }, [selectedBatch, selectedDepartment]);

  // Real-time subscription for application updates
  useEffect(() => {
    if (!selectedBatch || !selectedDepartment) return;

    const channel = supabase
      .channel('application-tracker-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `batch=eq.${selectedBatch},department=eq.${selectedDepartment}`
        },
        (payload) => {
          console.log('Application change detected:', payload);
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBatch, selectedDepartment]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('name')
        .order('start_year', { ascending: false });

      if (error) throw error;
      setBatches(data?.map((b) => b.name) || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      });
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('applications')
        .select(`
          *,
          profiles:student_id (name, usn, department, semester)
        `)
        .eq('batch', selectedBatch)
        .eq('department', selectedDepartment as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-application', {
        body: { application_id: applicationToDelete.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted successfully",
      });

      fetchApplications();
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateProgress = (app: any) => {
    let completed = 0;
    let total = 5; // Base verifications (library, college_office, hod, payment, lab)
    
    // Add hostel to total only if student is a hostel student
    if (app.profiles?.student_type === 'hostel') {
      total = 6;
      if (app.hostel_verified) completed++;
    }
    
    if (app.library_verified) completed++;
    if (app.college_office_verified) completed++;
    if (app.hod_verified) completed++;
    if (app.payment_verified) completed++;
    if (app.lab_verified) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      'pending': { variant: 'outline', label: 'Pending' },
      'completed': { variant: 'default', label: 'Completed' },
      'rejected': { variant: 'destructive', label: 'Rejected' },
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const stats = [
    { 
      title: "Total Applications", 
      value: applications.length, 
      icon: FileText, 
      color: "text-primary" 
    },
    { 
      title: "In Progress", 
      value: applications.filter(a => a.status !== 'completed' && a.status !== 'rejected').length, 
      icon: Clock, 
      color: "text-warning" 
    },
    { 
      title: "Completed", 
      value: applications.filter(a => a.status === 'completed').length, 
      icon: CheckCircle2, 
      color: "text-success" 
    },
    { 
      title: "Rejected", 
      value: applications.filter(a => a.status === 'rejected').length, 
      icon: XCircle, 
      color: "text-destructive" 
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Application Tracker" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Application Tracker</h1>
            <p className="text-muted-foreground">Select batch → department → view applications</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
            <CardDescription>Select batch and department to view applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedBatch && selectedDepartment && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <stat.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Applications Table */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Applications - {selectedBatch} / {selectedDepartment}</CardTitle>
                <CardDescription>No-due certificate applications from selected batch and department</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>USN</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length > 0 ? (
                      applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium font-mono text-xs">
                            {app.id.substring(0, 8)}
                          </TableCell>
                          <TableCell>{app.profiles?.name}</TableCell>
                          <TableCell className="font-medium">{app.profiles?.usn}</TableCell>
                          <TableCell>Sem {app.semester}</TableCell>
                          <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={calculateProgress(app)} className="w-20" />
                              <span className="text-xs text-muted-foreground">{calculateProgress(app)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(app.status).variant}>
                              {getStatusBadge(app.status).label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setApplicationToDelete(app);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No applications found for {selectedBatch} - {selectedDepartment}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this application? This action cannot be undone.
                {applicationToDelete && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium text-foreground">Application Details:</p>
                    <p className="text-sm">Student: {applicationToDelete.profiles?.name}</p>
                    <p className="text-sm">USN: {applicationToDelete.profiles?.usn}</p>
                    <p className="text-sm">Department: {applicationToDelete.department}</p>
                    <p className="text-sm">Batch: {applicationToDelete.batch}</p>
                    <p className="text-sm">Semester: {applicationToDelete.semester}</p>
                  </div>
                )}
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium">⚠️ This will also delete:</p>
                  <ul className="text-sm text-destructive mt-2 ml-4 list-disc">
                    <li>All faculty assignments for this application</li>
                    <li>All related notifications</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteApplication}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default ApplicationTracker;

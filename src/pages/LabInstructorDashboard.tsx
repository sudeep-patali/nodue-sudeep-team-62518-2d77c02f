import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, FlaskConical } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { toast } from "sonner";
import { ProfileSummaryCard } from "@/components/lab/ProfileSummaryCard";
import { FilterSection } from "@/components/lab/FilterSection";
import { PaymentRequestTabs } from "@/components/lab/PaymentRequestTabs";
import { PaymentDetailModal } from "@/components/lab/PaymentDetailModal";

export default function LabInstructorDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchStaffProfile();
    }
  }, [user]);

  useEffect(() => {
    if (staffProfile) {
      fetchApplications();
    }
  }, [staffProfile]);

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

  const fetchApplications = async () => {
    if (!staffProfile?.department) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('applications')
        .select(`
          *,
          profiles:student_id (name, usn, email, department, semester, photo, student_type)
        `)
        .eq('hod_verified', true)
        .not('transaction_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by lab instructor's department
      const departmentFiltered = (data || []).filter(
        (app: any) => app.profiles?.department === staffProfile.department
      );

      setApplications(departmentFiltered);
      setFilteredApplications(departmentFiltered);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    if (selectedDepartment !== "All") {
      filtered = filtered.filter((app) => app.profiles?.department === selectedDepartment);
    }

    if (selectedSemester !== "All") {
      filtered = filtered.filter((app) => app.profiles?.semester === parseInt(selectedSemester));
    }

    setFilteredApplications(filtered);
    toast.success("Filters applied");
  };

  const handleVerification = async (applicationId: string, approved: boolean, comment: string) => {
    setProcessing(true);
    try {
      // Update application status
      const { error } = await (supabase as any)
        .from('applications')
        .update({
          lab_verified: approved,
          lab_comment: comment || null,
          payment_verified: approved, // Mark payment as verified
          status: approved ? 'completed' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Create notification
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: selectedApp.student_id,
          title: approved ? 'No Due Certificate Approved!' : 'Lab Verification Rejected',
          message: approved 
            ? 'Congratulations! Your no-due certificate is ready and can now be downloaded.' 
            : `Lab verification rejected. Reason: ${comment || 'Not specified'}`,
          type: approved ? 'success' : 'rejection',
          related_entity_type: 'application',
          related_entity_id: applicationId
        });

      toast.success(
        approved 
          ? "Application approved! Student can now download certificate."
          : "Application rejected and student has been notified."
      );

      setSelectedApp(null);
      setShowDetailModal(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || "Failed to process verification");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (app: any) => {
    setSelectedApp(app);
    setShowDetailModal(true);
  };

  const handleApproveRejected = (app: any) => {
    setSelectedApp(app);
    setShowDetailModal(true);
  };

  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(a => 
      !a.lab_verified && !a.payment_verified && a.status !== 'rejected' && a.status !== 'completed'
    ).length,
    completed: filteredApplications.filter(a => a.lab_verified && a.status === 'completed').length,
    rejected: filteredApplications.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={staffProfile ? { ...staffProfile, role: 'Lab Instructor' } : user} 
        title="Lab Instructor Dashboard" 
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Summary */}
        <ProfileSummaryCard profile={staffProfile} />

        {/* Filter Section */}
        <FilterSection
          selectedDepartment={selectedDepartment}
          selectedSemester={selectedSemester}
          onDepartmentChange={setSelectedDepartment}
          onSemesterChange={setSelectedSemester}
          onApplyFilter={applyFilters}
        />

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
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

        {/* Payment Request Tabs */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading applications...</p>
            </CardContent>
          </Card>
        ) : (
          <PaymentRequestTabs
            applications={filteredApplications}
            onViewDetails={handleViewDetails}
            onApproveRejected={handleApproveRejected}
          />
        )}

        {/* Detail Modal */}
        <PaymentDetailModal
          application={selectedApp}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApp(null);
          }}
          onApprove={(comment) => handleVerification(selectedApp?.id, true, comment)}
          onReject={(comment) => handleVerification(selectedApp?.id, false, comment)}
          processing={processing}
        />
      </main>
    </div>
  );
}

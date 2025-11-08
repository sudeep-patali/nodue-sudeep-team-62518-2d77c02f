import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Edit,
  CreditCard,
  Bell,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DashboardHeader from "@/components/DashboardHeader";
import { useNotifications } from "@/hooks/useNotifications";
import { generateCertificateHTML } from "@/utils/certificateGenerator";
import { Badge } from "@/components/ui/badge";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  usn: string;
  phone: string;
  department: string;
  section: string;
  semester: number;
  student_type: string;
  batch: string;
  photo?: string;
  profile_completed: boolean;
}

interface FacultyAssignment {
  id: string;
  faculty_verified: boolean;
  faculty_comment?: string;
  verified_at?: string;
  subjects: {
    name: string;
    code: string;
  };
  staff_profiles: {
    name: string;
    designation: string;
    department: string;
  };
}

interface Application {
  id: string;
  student_id: string;
  department: string;
  semester: number;
  batch: string;
  status: string;
  library_verified: boolean;
  hostel_verified: boolean;
  college_office_verified: boolean;
  faculty_verified: boolean;
  hod_verified: boolean;
  payment_verified: boolean;
  lab_verified: boolean;
  created_at: string;
  updated_at: string;
  library_comment?: string;
  hostel_comment?: string;
  college_office_comment?: string;
  faculty_comment?: string;
  hod_comment?: string;
  payment_comment?: string;
  lab_comment?: string;
  transaction_id?: string;
  faculty_assignments?: FacultyAssignment[];
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submissionsAllowed, setSubmissionsAllowed] = useState(true);
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [expandedFaculty, setExpandedFaculty] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login/student");
      return;
    }

    fetchStudentData();

    // Real-time subscription for faculty verifications
    const channel = supabase
      .channel('student-faculty-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'application_subject_faculty'
      }, () => {
        fetchStudentData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if profile is completed
      if (!profileData.profile_completed) {
        navigate('/student/complete-profile');
        return;
      }

      setProfile(profileData);

      // Check submission status
      await checkSubmissionStatus(profileData.batch);

      // Fetch student applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Fetch faculty assignments for each application
      const applicationsWithFaculty = await Promise.all(
        (applicationsData || []).map(async (app) => {
          const { data: facultyAssignments } = await supabase
            .from('application_subject_faculty')
            .select(`
              id,
              faculty_verified,
              faculty_comment,
              verified_at,
              subjects:subject_id(name, code),
              staff_profiles:faculty_id(name, designation, department)
            `)
            .eq('application_id', app.id)
            .order('created_at', { ascending: true });
          
          // Filter out assignments with missing subject or faculty data
          const validAssignments = (facultyAssignments || []).filter(
            assignment => assignment.subjects && assignment.staff_profiles
          );
          
          return {
            ...app,
            faculty_assignments: validAssignments
          };
        })
      );

      setApplications(applicationsWithFaculty);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubmissionStatus = async (batchName: string) => {
    try {
      // Check batch-specific settings first
      const { data: batchSetting } = await supabase
        .from('batch_submission_settings')
        .select('*')
        .eq('batch_name', batchName)
        .maybeSingle();

      const now = new Date();
      let settings = batchSetting;

      // If no batch-specific settings, use global
      if (!settings) {
        const { data: globalSetting } = await supabase
          .from('global_submission_settings')
          .select('*')
          .maybeSingle();
        settings = globalSetting;
      }

      if (!settings) {
        setSubmissionsAllowed(true);
        return;
      }

      // Check enabled flag
      if (!settings.enabled) {
        setSubmissionsAllowed(false);
        setSubmissionMessage('Submissions are currently disabled by administration');
        return;
      }

      // Check schedule
      if (settings.scheduled_start) {
        const start = new Date(settings.scheduled_start);
        if (now < start) {
          setSubmissionsAllowed(false);
          setSubmissionMessage(`Submissions will open on ${start.toLocaleString()}`);
          return;
        }
      }

      if (settings.scheduled_end) {
        const end = new Date(settings.scheduled_end);
        if (now > end) {
          setSubmissionsAllowed(false);
          setSubmissionMessage('Submission window has closed');
          return;
        }
      }

      setSubmissionsAllowed(true);
    } catch (error) {
      console.error('Error checking submission status:', error);
      setSubmissionsAllowed(true); // Default to allowing on error
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCertificateDownload = () => {
    if (!currentApplication || !profile) {
      toast.error("Certificate data not available");
      return;
    }
    
    const certificateWindow = window.open('', '_blank', 'width=800,height=600');
    if (!certificateWindow) {
      toast.error('Please allow pop-ups to download certificate');
      return;
    }
    
    try {
      const certificateHTML = generateCertificateHTML(currentApplication, profile);
      certificateWindow.document.write(certificateHTML);
      certificateWindow.document.close();
      
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        certificateWindow.print();
      }, 250);
      
      toast.success("Certificate opened. Use Print dialog to save as PDF");
    } catch (error) {
      console.error("Error generating certificate:", error);
      certificateWindow.close();
      toast.error("Failed to generate certificate");
    }
  };

  const calculateProgress = (app: Application) => {
    const allFacultyVerified = app.faculty_assignments?.every(a => a.faculty_verified) ?? false;
    
    const steps = [
      app.library_verified,
      profile?.student_type === 'hostel' ? app.hostel_verified : true,
      app.college_office_verified,
      allFacultyVerified,
      app.hod_verified,
      app.payment_verified,
      app.lab_verified
    ];
    const completed = steps.filter(Boolean).length;
    return (completed / steps.length) * 100;
  };

  const activeApplications = applications.filter(app => app.status !== 'completed' && app.status !== 'rejected');
  const completedApplications = applications.filter(app => app.status === 'completed');
  const currentApplication = applications[0];

  const stats = [
    {
      title: "Active Applications",
      value: activeApplications.length.toString(),
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Pending Approvals",
      value: currentApplication ? 
        [
          !currentApplication.library_verified,
          !currentApplication.hostel_verified && profile?.student_type === 'hostel',
          !currentApplication.college_office_verified,
          !currentApplication.faculty_verified,
          !currentApplication.hod_verified,
          !currentApplication.payment_verified,
          !currentApplication.lab_verified
        ].filter(Boolean).length.toString() : "0",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Completed",
      value: completedApplications.length.toString(),
      icon: CheckCircle2,
      color: "text-success"
    }
  ];

  const verificationSteps = currentApplication ? [
    { 
      name: "Library", 
      verified: currentApplication.library_verified, 
      required: true,
      comment: currentApplication.library_comment 
    },
    { 
      name: "Hostel", 
      verified: currentApplication.hostel_verified, 
      required: profile?.student_type === 'hostel',
      comment: currentApplication.hostel_comment 
    },
    { 
      name: "College Office", 
      verified: currentApplication.college_office_verified, 
      required: true,
      comment: currentApplication.college_office_comment 
    },
    { 
      name: "Faculty", 
      verified: currentApplication.faculty_verified, 
      required: true,
      comment: currentApplication.faculty_comment 
    },
    { 
      name: "HOD", 
      verified: currentApplication.hod_verified, 
      required: true,
      comment: currentApplication.hod_comment 
    },
    { 
      name: "Lab Charge Payment", 
      verified: currentApplication.payment_verified, 
      required: true,
      comment: currentApplication.payment_comment 
    },
    { 
      name: "Lab Instructor", 
      verified: currentApplication.lab_verified, 
      required: true,
      comment: currentApplication.lab_comment 
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center mb-4">Profile not found</p>
            <Button onClick={() => navigate('/student/complete-profile')} className="w-full">
              Complete Your Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <DashboardHeader 
        title="Student Dashboard"
        user={{
          name: profile.name,
          email: profile.email,
          role: 'student'
        }}
      />

      <div className="container mx-auto p-6">
        {/* Profile Summary Card */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                {profile.photo ? (
                  <AvatarImage src={profile.photo} alt={profile.name} />
                ) : (
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">Welcome, {profile.name}!</h2>
                <div className="space-y-1 text-muted-foreground">
                  <p className="text-lg font-semibold text-foreground">{profile.usn}</p>
                  <p>{profile.department} - Section {profile.section} • Semester {profile.semester}</p>
                  <p>{profile.email}</p>
                  <p className="capitalize">{profile.student_type} Student • Batch {profile.batch}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => navigate('/student/profile')} variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
                <Button onClick={() => navigate('/student/edit-profile')} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-4xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon className={`h-12 w-12 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submission Not Available Alert */}
        {!submissionsAllowed && (
          <Card className="mb-6 border-2 border-warning bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-1">Submissions Not Available</h4>
                  <p className="text-sm text-muted-foreground">
                    {submissionMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button 
            size="lg" 
            className="h-24 text-lg"
            onClick={() => navigate('/student/submit-form')}
            disabled={!submissionsAllowed}
          >
            <Plus className="h-6 w-6 mr-2" />
            Submit No-Due Application
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            className="h-24 text-lg"
            disabled={!currentApplication || !currentApplication.hod_verified || currentApplication.payment_verified}
            onClick={() => navigate('/student/lab-payment')}
          >
            <CreditCard className="h-6 w-6 mr-2" />
            Lab Charge Payment
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="h-24 text-lg"
            disabled={!currentApplication || !currentApplication.lab_verified}
            onClick={handleCertificateDownload}
          >
            <Download className="h-6 w-6 mr-2" />
            Download Certificate
          </Button>
        </div>

        {/* Current Application Status */}
        {currentApplication && (
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Application Status</CardTitle>
                  <CardDescription>Track your No-Due application progress</CardDescription>
                </div>
                <StatusBadge status={currentApplication.status as any} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Submitted on {new Date(currentApplication.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-semibold">
                    {Math.round(calculateProgress(currentApplication))}% Complete
                  </span>
                </div>
                <Progress value={calculateProgress(currentApplication)} className="h-2" />
              </div>

              {/* Verification Steps */}
              <div className="space-y-4">
                {verificationSteps.map((step, index) => {
                  if (!step.required) return null;
                  
                  // Special handling for Faculty verification
                  if (step.name === "Faculty" && currentApplication.faculty_assignments?.length > 0) {
                    const allFacultyVerified = currentApplication.faculty_assignments.every(a => a.faculty_verified);
                    const verifiedCount = currentApplication.faculty_assignments.filter(a => a.faculty_verified).length;
                    const totalCount = currentApplication.faculty_assignments.length;
                    
                    return (
                      <div key={step.name}>
                        <div 
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setExpandedFaculty(!expandedFaculty)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            allFacultyVerified
                              ? 'bg-success/20 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {allFacultyVerified ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <Clock className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-base">Faculty Verification</p>
                            <p className="text-sm mt-1">
                              {verifiedCount} of {totalCount} faculty verified
                            </p>
                          </div>
                          {expandedFaculty ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Detailed Faculty Assignments */}
                        {expandedFaculty && (
                          <div className="space-y-3 mt-3 pl-4">
                            {currentApplication.faculty_assignments.length > 0 ? (
                              currentApplication.faculty_assignments.map((assignment) => {
                                // Additional safety check
                                if (!assignment.subjects || !assignment.staff_profiles) {
                                  return null;
                                }
                                
                                return (
                                  <div key={assignment.id} className="border rounded-lg p-4 bg-card">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <p className="font-semibold">
                                            {assignment.subjects.name} ({assignment.subjects.code})
                                          </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          Faculty: {assignment.staff_profiles.name}
                                          <span className="ml-2 text-xs">
                                            ({assignment.staff_profiles.designation}, {assignment.staff_profiles.department})
                                          </span>
                                        </p>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        {assignment.faculty_verified ? (
                                          <>
                                            <Badge className="bg-success/10 text-success border-success/20">
                                              <CheckCircle2 className="h-3 w-3 mr-1" />
                                              Verified
                                            </Badge>
                                            {assignment.verified_at && (
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(assignment.verified_at).toLocaleDateString()}
                                              </p>
                                            )}
                                          </>
                                        ) : (
                                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Pending
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {assignment.faculty_comment && (
                                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                                        <p className="text-xs text-muted-foreground mb-1">Faculty Comment:</p>
                                        <p>{assignment.faculty_comment}</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No faculty assignments found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={step.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.verified 
                          ? 'bg-success/20 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.verified ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Clock className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {step.name} Verification
                        </p>
                        {step.verified ? (
                          <p className="text-sm text-success mt-1">✓ Verified</p>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">Pending verification</p>
                        )}
                        {step.comment && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                            Comment: {step.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Reminder */}
              {currentApplication.hod_verified && !currentApplication.payment_verified && (
                <div className="mt-6 p-4 bg-warning/10 rounded-lg border-2 border-warning">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-warning text-lg">Lab Charge Payment Required</h4>
                      <p className="text-sm text-foreground mt-2">
                        Your application has been approved by the HOD. Please proceed with the lab charge payment to continue.
                      </p>
                      <Button 
                        className="mt-3" 
                        onClick={() => navigate('/student/lab-payment')}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Submit Payment Details
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Active Application */}
        {!currentApplication && (
          <Card className="mb-6 border-2 border-dashed">
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Application</h3>
              <p className="text-muted-foreground mb-4">
                You haven't submitted a No-Due application yet.
              </p>
              <Button onClick={() => navigate('/student/submit-form')}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Your First Application
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Notifications */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
                {unreadCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </CardTitle>
              <Button variant="link" onClick={() => navigate('/student/notifications')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'approval' ? 'bg-success/20 text-success' :
                      notification.type === 'rejection' ? 'bg-destructive/20 text-destructive' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {notification.type === 'approval' ? <CheckCircle2 className="h-5 w-5" /> :
                       notification.type === 'rejection' ? <AlertCircle className="h-5 w-5" /> :
                       <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;

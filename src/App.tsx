import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminSignup from "./pages/AdminSignup";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AddStudent from "./pages/AddStudent";
import AddFaculty from "./pages/AddFaculty";
import AddStaff from "./pages/AddStaff";
import SubjectManagement from "./pages/SubjectManagement";
import ApplicationTracker from "./pages/ApplicationTracker";
import UserManagement from "./pages/UserManagement";
import UpdateSemester from "./pages/UpdateSemester";
import AdminProfile from "./pages/AdminProfile";
import EditAdminProfile from "./pages/EditAdminProfile";
import Notifications from "./pages/Notifications";
import CompleteStudentProfile from "./pages/CompleteStudentProfile";
import StudentProfile from "./pages/StudentProfile";
import EditStudentProfile from "./pages/EditStudentProfile";
import SubmitNoDueForm from "./pages/SubmitNoDueForm";
import LabPayment from "./pages/LabPayment";
import CompleteStaffProfile from "./pages/CompleteStaffProfile";
import StaffProfile from "./pages/StaffProfile";
import EditStaffProfile from "./pages/EditStaffProfile";
import FacultyDashboard from "./pages/FacultyDashboard";
import HODDashboard from "./pages/HODDashboard";
import LibraryDashboard from "./pages/LibraryDashboard";
import HostelDashboard from "./pages/HostelDashboard";
import CollegeOfficeDashboard from "./pages/CollegeOfficeDashboard";
import LabInstructorDashboard from "./pages/LabInstructorDashboard";
import CounsellorDashboard from "./pages/CounsellorDashboard";
import ClassAdvisorDashboard from "./pages/ClassAdvisorDashboard";
import LabInstructorProfile from "./pages/LabInstructorProfile";
import EditLabInstructorProfile from "./pages/EditLabInstructorProfile";
import HostelProfile from "./pages/HostelProfile";
import EditHostelProfile from "./pages/EditHostelProfile";
import CollegeOfficeProfile from "./pages/CollegeOfficeProfile";
import EditCollegeOfficeProfile from "./pages/EditCollegeOfficeProfile";
import LibraryProfile from "./pages/LibraryProfile";
import EditLibraryProfile from "./pages/EditLibraryProfile";
import ControlPanel from "./pages/ControlPanel";
import ControlPanelStudents from "./pages/ControlPanelStudents";
import ControlPanelFaculty from "./pages/ControlPanelFaculty";
import ControlPanelStaff from "./pages/ControlPanelStaff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/:role" element={<Login />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route 
              path="/dashboard/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/add-student" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddStudent />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/add-faculty" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddFaculty />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/add-staff" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AddStaff />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/subjects" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <SubjectManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/tracker" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ApplicationTracker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/update-semester" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <UpdateSemester />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/profile/edit" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditAdminProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/notifications" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/notifications" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/complete-profile" 
              element={
                <ProtectedRoute requiredRole="student">
                  <CompleteStudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/edit-profile" 
              element={
                <ProtectedRoute requiredRole="student">
                  <EditStudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/submit-form" 
              element={
                <ProtectedRoute requiredRole="student">
                  <SubmitNoDueForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/lab-payment" 
              element={
                <ProtectedRoute requiredRole="student">
                  <LabPayment />
                </ProtectedRoute>
              } 
            />
            <Route path="/staff/complete-profile" element={<CompleteStaffProfile />} />
            <Route path="/staff/profile" element={<StaffProfile />} />
            <Route path="/staff/edit-profile" element={<EditStaffProfile />} />
            {/* Faculty Dashboard */}
            <Route 
              path="/dashboard/faculty" 
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            {/* HOD Dashboard */}
            <Route 
              path="/dashboard/hod" 
              element={
                <ProtectedRoute requiredRole="hod">
                  <HODDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Library Dashboard */}
            <Route 
              path="/dashboard/library" 
              element={
                <ProtectedRoute requiredRole="library">
                  <LibraryDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Hostel Dashboard */}
            <Route 
              path="/dashboard/hostel" 
              element={
                <ProtectedRoute requiredRole="hostel">
                  <HostelDashboard />
                </ProtectedRoute>
              } 
            />
            {/* College Office Dashboard */}
            <Route 
              path="/dashboard/college_office" 
              element={
                <ProtectedRoute requiredRole="college_office">
                  <CollegeOfficeDashboard />
                </ProtectedRoute>
              } 
            />
            {/* Lab Instructor Dashboard */}
            <Route 
              path="/dashboard/lab_instructor" 
              element={
                <ProtectedRoute requiredRole="lab_instructor">
                  <LabInstructorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lab-instructor/profile" 
              element={
                <ProtectedRoute requiredRole="lab_instructor">
                  <LabInstructorProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lab-instructor/profile/edit" 
              element={
                <ProtectedRoute requiredRole="lab_instructor">
                  <EditLabInstructorProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hostel/profile" 
              element={
                <ProtectedRoute requiredRole="hostel">
                  <HostelProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hostel/profile/edit" 
              element={
                <ProtectedRoute requiredRole="hostel">
                  <EditHostelProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library/profile" 
              element={
                <ProtectedRoute requiredRole="library">
                  <LibraryProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library/profile/edit" 
              element={
                <ProtectedRoute requiredRole="library">
                  <EditLibraryProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library/notifications" 
              element={
                <ProtectedRoute requiredRole="library">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hostel/notifications" 
              element={
                <ProtectedRoute requiredRole="hostel">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lab-instructor/notifications" 
              element={
                <ProtectedRoute requiredRole="lab_instructor">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/college-office/notifications" 
              element={
                <ProtectedRoute requiredRole="college_office">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty/notifications" 
              element={
                <ProtectedRoute requiredRole="faculty">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hod/notifications" 
              element={
                <ProtectedRoute requiredRole="hod">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            {/* Counsellor Dashboard */}
            <Route 
              path="/dashboard/counsellor" 
              element={
                <ProtectedRoute requiredRole="counsellor">
                  <CounsellorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/counsellor/notifications" 
              element={
                <ProtectedRoute requiredRole="counsellor">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/counsellor/profile" 
              element={
                <ProtectedRoute requiredRole="counsellor">
                  <StaffProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/counsellor/profile/edit" 
              element={
                <ProtectedRoute requiredRole="counsellor">
                  <EditStaffProfile />
                </ProtectedRoute>
              } 
            />
            {/* Class Advisor Dashboard */}
            <Route 
              path="/dashboard/class_advisor" 
              element={
                <ProtectedRoute requiredRole="class_advisor">
                  <ClassAdvisorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/class-advisor/notifications" 
              element={
                <ProtectedRoute requiredRole="class_advisor">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/class-advisor/profile" 
              element={
                <ProtectedRoute requiredRole="class_advisor">
                  <StaffProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/class-advisor/profile/edit" 
              element={
                <ProtectedRoute requiredRole="class_advisor">
                  <EditStaffProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/college-office/profile"
              element={
                <ProtectedRoute requiredRole="college_office">
                  <CollegeOfficeProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/college-office/profile/edit" 
              element={
                <ProtectedRoute requiredRole="college_office">
                  <EditCollegeOfficeProfile />
                </ProtectedRoute>
              } 
            />
            {/* Control Panel Routes */}
            <Route 
              path="/admin/control-panel" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ControlPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/control-panel/students" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ControlPanelStudents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/control-panel/faculty" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ControlPanelFaculty />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/control-panel/staff" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ControlPanelStaff />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roleNames: Record<string, string> = {
    student: 'Student',
    admin: 'Admin',
    library: 'Library Staff',
    hostel: 'Hostel Staff',
    college_office: 'College Office',
    faculty: 'Faculty',
    hod: 'HOD',
    lab_instructor: 'Lab Instructor',
    counsellor: 'Student Counsellor',
    class_advisor: 'Class Advisor'
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        toast.error('Invalid credentials');
        return;
      }

      if (!data.session) {
        toast.error('Failed to create session');
        return;
      }

      // Verify user has the role matching the login page
      const { data: userRoles } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id);

      const hasRole = userRoles?.some((r: any) => r.role === role);
      
      if (!hasRole) {
        await supabase.auth.signOut();
        toast.error(`You don't have ${roleNames[role || '']} permissions`);
        return;
      }

      // For students, verify their batch exists in the system
      if (role === 'student') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('batch')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (profile?.batch) {
          const { data: batchExists } = await supabase
            .from('batches')
            .select('id')
            .eq('name', profile.batch)
            .maybeSingle();

          if (!batchExists) {
            await supabase.auth.signOut();
            toast.error('Your batch is not registered in the system. Please contact the administrator.');
            return;
          }
        }
      }

      // Check if profile is completed
      const profileTable = role === 'student' ? 'profiles' : 'staff_profiles';
      const { data: profileData } = await supabase
        .from(profileTable)
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      // For students, check profile_completed flag
      if (role === 'student' && profileData) {
        const studentProfile = profileData as { profile_completed?: boolean };
        if (!studentProfile.profile_completed) {
          toast.info('Please complete your profile');
          navigate('/student/complete-profile');
          return;
        }
      }

      // For staff, check if profile has required fields (name, phone, designation)
      if (role !== 'student' && profileData) {
        const staffProfile = profileData as { name?: string; phone?: string; designation?: string };
        if (!staffProfile.name || !staffProfile.phone || !staffProfile.designation) {
          toast.info('Please complete your profile');
          navigate('/staff/complete-profile');
          return;
        }
      }

      toast.success('Login successful!');
      navigate(`/dashboard/${role}`);
      
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                <GraduationCap className="h-10 w-10" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">
                {roleNames[role || ''] || 'User'} Login
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  {['library', 'hostel', 'college_office', 'lab_instructor', 'faculty', 'hod', 'counsellor', 'class_advisor'].includes(role || '')
                    ? 'Password (Employee ID)'
                    : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={['library', 'hostel', 'college_office', 'lab_instructor', 'faculty', 'hod', 'counsellor', 'class_advisor'].includes(role || '')
                    ? 'Enter your employee ID'
                    : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Contact admin if you forgot your credentials
        </p>

        {role === 'admin' && (
          <div className="text-center mt-2">
            <Button
              variant="link"
              onClick={() => navigate('/admin/signup')}
              className="text-sm"
            >
              Need to create an admin account?
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

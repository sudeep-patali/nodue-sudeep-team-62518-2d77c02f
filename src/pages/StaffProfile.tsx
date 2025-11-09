import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, Building2, MapPin, Edit, Briefcase } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  office_location: string;
  employee_id: string;
  created_at: string;
}

const StaffProfile = () => {
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      const role = userRoles[0] || 'admin';
      navigate(`/login/${role}`);
      return;
    }

    fetchProfile();
  }, [user, userRoles, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setIsLoading(false);
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

  const getDepartmentName = (dept: string) => {
    const deptNames: Record<string, string> = {
      MECH: 'Mechanical Engineering',
      CSE: 'Computer Science & Engineering',
      CIVIL: 'Civil Engineering',
      EC: 'Electronics & Communication',
      AIML: 'Artificial Intelligence & Machine Learning',
      CD: 'Computer Science & Design'
    };
    return deptNames[dept] || dept;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center mb-4">Profile not found</p>
            <Button onClick={() => navigate(`/dashboard/${userRoles[0]}`)} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <DashboardHeader 
        title="My Profile"
        user={{
          name: profile.name,
          email: profile.email,
          role: userRoles[0] || 'admin'
        }}
      />

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button onClick={() => {
            const rolePrefix = userRoles[0] === 'counsellor' ? '/counsellor' 
              : userRoles[0] === 'class_advisor' ? '/class-advisor' 
              : '/staff';
            navigate(`${rolePrefix}/profile/edit`);
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <p className="text-muted-foreground mb-2">{profile.designation}</p>
                {profile.employee_id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{profile.employee_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Work Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.department && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{getDepartmentName(profile.department)}</p>
                    </div>
                  </div>
                )}
                {profile.office_location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Office Location</p>
                      <p className="font-medium">{profile.office_location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate(`/dashboard/${userRoles[0]}`)} className="w-full md:w-auto">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;

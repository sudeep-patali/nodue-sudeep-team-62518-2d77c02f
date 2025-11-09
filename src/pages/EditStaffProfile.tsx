import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import { ArrowLeft } from "lucide-react";

const EditStaffProfile = () => {
  const navigate = useNavigate();
  const { user, userRoles, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    designation: string;
    department: "AIML" | "CD" | "CIVIL" | "CSE" | "EC" | "MECH" | "";
    office_location: string;
    employee_id: string;
  }>({
    name: "",
    phone: "",
    designation: "",
    department: "",
    office_location: "",
    employee_id: ""
  });

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

      if (data) {
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          designation: data.designation || "",
          department: data.department || "",
          office_location: data.office_location || "",
          employee_id: data.employee_id || ""
        });
        setEmail(data.email || user.email || "");
      }
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsLoading(true);

    try {
      const updateData = {
        ...formData,
        department: formData.department || null
      };

      const { error } = await supabase
        .from('staff_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      await refreshProfile();
      const rolePrefix = userRoles[0] === 'counsellor' ? '/counsellor' 
        : userRoles[0] === 'class_advisor' ? '/class-advisor' 
        : '/staff';
      navigate(`${rolePrefix}/profile`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <DashboardHeader 
        title="Edit Profile"
        user={{
          name: formData.name,
          email: email,
          role: userRoles[0] || 'admin'
        }}
      />

      <div className="container mx-auto p-6 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => {
            const rolePrefix = userRoles[0] === 'counsellor' ? '/counsellor' 
              : userRoles[0] === 'class_advisor' ? '/class-advisor' 
              : '/staff';
            navigate(`${rolePrefix}/profile`);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as typeof formData.department })}
                  disabled={isLoading}
                >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MECH">Mechanical</SelectItem>
                      <SelectItem value="CSE">Computer Science</SelectItem>
                      <SelectItem value="CIVIL">Civil</SelectItem>
                      <SelectItem value="EC">Electronics & Communication</SelectItem>
                      <SelectItem value="AIML">AI & ML</SelectItem>
                      <SelectItem value="CD">Computer Science & Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="office_location">Office Location</Label>
                  <Input
                    id="office_location"
                    value={formData.office_location}
                    onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                    disabled={isLoading}
                    placeholder="e.g., Block A, Room 301"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const rolePrefix = userRoles[0] === 'counsellor' ? '/counsellor' 
                      : userRoles[0] === 'class_advisor' ? '/class-advisor' 
                      : '/staff';
                    navigate(`${rolePrefix}/profile`);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditStaffProfile;

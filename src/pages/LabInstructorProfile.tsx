import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, Calendar, Award, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { Separator } from "@/components/ui/separator";

export default function LabInstructorProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, avgTime: "N/A" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setStaffProfile(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user?.id) return;

    const { data } = await (supabase as any)
      .from("applications")
      .select("*")
      .eq("payment_verified", true);

    if (data) {
      setStats({
        total: data.length,
        approved: data.filter((a: any) => a.lab_verified && a.status === "completed").length,
        rejected: data.filter((a: any) => a.status === "rejected" && !a.lab_verified).length,
        avgTime: "2-3 hours",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={user} title="Lab Instructor Profile" />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={staffProfile ? { ...staffProfile, role: "Lab Instructor" } : user} title="My Profile" />

      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/lab-instructor")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={staffProfile?.photo} alt={staffProfile?.name} />
                  <AvatarFallback className="text-4xl">
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{staffProfile?.name}</h3>
                    <p className="text-muted-foreground">Lab Instructor</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Staff ID</p>
                        <p className="font-medium">{staffProfile?.employee_id || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{staffProfile?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{staffProfile?.phone || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Joined On</p>
                        <p className="font-medium">
                          {staffProfile?.date_of_joining
                            ? new Date(staffProfile.date_of_joining).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Login ID</p>
                <p className="font-medium">{staffProfile?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {staffProfile?.created_at
                    ? new Date(staffProfile.created_at).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="font-medium">Recently</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Verification Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Processed</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-success">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approvals</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejections</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{stats.avgTime}</p>
                  <p className="text-sm text-muted-foreground">Avg. Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StaffProfileSummaryCard from "@/components/staff/StaffProfileSummaryCard";
import ApplicationDetailModal from "@/components/class-advisor/ApplicationDetailModal";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ClassAdvisorDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          profiles:student_id (
            name,
            usn,
            photo,
            email,
            department,
            section,
            semester,
            student_type
          )
        `)
        .eq("counsellor_verified", true)
        .eq("class_advisor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingApplications = applications.filter(
    (app) => !app.class_advisor_verified && app.status !== "rejected"
  );
  const approvedApplications = applications.filter(
    (app) => app.class_advisor_verified && app.status !== "rejected"
  );
  const rejectedApplications = applications.filter(
    (app) => app.status === "rejected" && app.class_advisor_comment
  );

  const filteredApplications = (list: any[]) => {
    if (!searchQuery) return list;
    return list.filter(
      (app) =>
        app.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.profiles?.usn?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const stats = [
    {
      title: "Total Applications",
      value: applications.length,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Pending Requests",
      value: pendingApplications.length,
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      title: "Approved",
      value: approvedApplications.length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Rejected",
      value: rejectedApplications.length,
      icon: XCircle,
      color: "bg-red-500",
    },
  ];

  const ApplicationCard = ({ application }: { application: any }) => {
    const student = application.profiles;
    const isRejected = application.status === "rejected" && application.class_advisor_comment;
    const isApproved = application.class_advisor_verified;

    return (
      <Card
        className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
          isApproved ? "bg-green-50 dark:bg-green-950" : isRejected ? "bg-red-50 dark:bg-red-950" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student?.photo} />
              <AvatarFallback>{student?.name?.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{student?.name}</h3>
              <p className="text-sm text-muted-foreground">{student?.usn}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{student?.department}</Badge>
                <Badge variant="outline">Semester {student?.semester}</Badge>
                {student?.section && <Badge variant="outline">Section {student?.section}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted: {format(new Date(application.created_at), "MMM dd, yyyy")}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {isApproved && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
              )}
              {isRejected && (
                <XCircle className="h-5 w-5 text-red-500 ml-auto" />
              )}
              <Button
                variant={isRejected ? "default" : "outline"}
                onClick={() => setSelectedApplication(application)}
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout role="class_advisor" title="Class Advisor Dashboard">
      <div className="space-y-6">
        {profile && (
          <StaffProfileSummaryCard
            profile={profile}
            role="Class Advisor"
            basePath="/class-advisor"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or USN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({pendingApplications.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedApplications.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedApplications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                {filteredApplications(pendingApplications).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending applications</p>
                  </div>
                ) : (
                  filteredApplications(pendingApplications).map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                {filteredApplications(approvedApplications).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No approved applications</p>
                  </div>
                ) : (
                  filteredApplications(approvedApplications).map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                {filteredApplications(rejectedApplications).length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No rejected applications</p>
                  </div>
                ) : (
                  filteredApplications(rejectedApplications).map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          open={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={fetchApplications}
        />
      )}
    </DashboardLayout>
  );
}

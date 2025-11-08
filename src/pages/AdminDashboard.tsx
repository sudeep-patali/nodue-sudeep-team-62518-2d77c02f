import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Users, 
  BookOpen, 
  ClipboardList, 
  Settings,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApplications: 0,
    activeApplications: 0,
    pendingApprovals: 0,
    rejectedApplications: 0
  });

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      // Fetch total students
      const { count: totalStudents } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total applications
      const { count: totalApplications } = await (supabase as any)
        .from('applications')
        .select('*', { count: 'exact', head: true });

      // Fetch active applications (not rejected)
      const { count: activeApplications } = await (supabase as any)
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'rejected');

      // Fetch pending approvals
      const { count: pendingApprovals } = await (supabase as any)
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch rejected applications
      const { count: rejectedApplications } = await (supabase as any)
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      setStats({
        totalStudents: totalStudents || 0,
        totalApplications: totalApplications || 0,
        activeApplications: activeApplications || 0,
        pendingApprovals: pendingApprovals || 0,
        rejectedApplications: rejectedApplications || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchStats();
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const applicationsChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const statsDisplay = [
    {
      title: "Total Applications",
      value: stats.totalApplications.toString(),
      icon: FileCheck,
      color: "text-primary"
    },
    {
      title: "Active Applications",
      value: stats.activeApplications.toString(),
      icon: FileCheck,
      color: "text-success"
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Rejected Applications",
      value: stats.rejectedApplications.toString(),
      icon: AlertCircle,
      color: "text-destructive"
    }
  ];

  const quickActions = [
    {
      title: "My Profile",
      description: "View and edit your staff profile information",
      icon: Users,
      href: "/admin/profile",
      color: "bg-accent"
    },
    {
      title: "Add Students",
      description: "Create student accounts with login credentials",
      icon: Users,
      href: "/admin/add-student",
      color: "bg-primary"
    },
    {
      title: "Add Faculty", 
      description: "Create faculty accounts with login credentials",
      icon: Users,
      href: "/admin/add-faculty",
      color: "bg-success"
    },
    {
      title: "Add Staff",
      description: "Create staff accounts for library, hostel, office & lab",
      icon: Users,
      href: "/admin/add-staff",
      color: "bg-secondary"
    },
    {
      title: "Subject Management",
      description: "Configure subjects, semesters, and electives",
      icon: BookOpen,
      href: "/admin/subjects",
      color: "bg-warning"
    },
    {
      title: "Application Tracker",
      description: "Monitor all no-due applications and their status", 
      icon: ClipboardList,
      href: "/admin/tracker",
      color: "bg-destructive"
    },
    {
      title: "Update Semester",
      description: "Bulk update semester for entire batch of students",
      icon: Settings,
      href: "/admin/update-semester",
      color: "bg-accent"
    }
  ];


  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={profile} title="Admin Dashboard" showNotifications={false} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.name || 'Admin'}
          </h1>
          <p className="text-muted-foreground">
            Manage the entire no-due certificate system from your admin dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            statsDisplay.map((stat, index) => (
              <Card key={index} className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <Button asChild className="w-full">
                  <Link to={action.href}>
                    Access Module
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Home, 
  Building2, 
  Users, 
  UserCog, 
  FlaskConical 
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    { 
      id: 'student', 
      title: 'Student', 
      icon: GraduationCap, 
      description: 'Submit and track No-Due applications',
      color: 'bg-primary'
    },
    { 
      id: 'admin', 
      title: 'Admin', 
      icon: UserCog, 
      description: 'Manage users and system settings',
      color: 'bg-purple-600'
    },
    { 
      id: 'library', 
      title: 'Library', 
      icon: BookOpen, 
      description: 'Verify library clearance',
      color: 'bg-blue-600'
    },
    { 
      id: 'hostel', 
      title: 'Hostel', 
      icon: Home, 
      description: 'Verify hostel clearance',
      color: 'bg-green-600'
    },
    { 
      id: 'college_office', 
      title: 'College Office', 
      icon: Building2, 
      description: 'Verify college office clearance',
      color: 'bg-orange-600'
    },
    { 
      id: 'faculty', 
      title: 'Faculty', 
      icon: Users, 
      description: 'Verify subject clearance',
      color: 'bg-indigo-600'
    },
    { 
      id: 'hod', 
      title: 'HOD', 
      icon: User, 
      description: 'Department head verification',
      color: 'bg-red-600'
    },
    { 
      id: 'lab_instructor', 
      title: 'Lab Instructor', 
      icon: FlaskConical, 
      description: 'Verify lab charge payment',
      color: 'bg-teal-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Nodex</h1>
                <p className="text-sm text-muted-foreground">Digital No-Due Certificate System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Welcome to Nodex
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            Streamlined digital No-Due certificate generation and verification system
          </p>
          <p className="text-muted-foreground">
            Select your role below to access your portal
          </p>
        </div>
        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary"
                onClick={() => navigate(`/login/${role.id}`)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`${role.color} text-white p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Login
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            System Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-success/10 text-success p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Multi-Step Verification</h4>
              <p className="text-muted-foreground">Streamlined approval workflow across all departments</p>
            </div>
            <div className="text-center">
              <div className="bg-warning/10 text-warning p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Real-Time Notifications</h4>
              <p className="text-muted-foreground">Instant updates on application status changes</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2">Digital Certificates</h4>
              <p className="text-muted-foreground">Download verified No-Due certificates instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Nodex - Digital No-Due Certificate System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

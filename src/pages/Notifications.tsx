import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trash2, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  getNotificationIcon, 
  getNotificationColor, 
  formatNotificationTime, 
  getNotificationBadgeVariant 
} from "@/lib/notifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Determine current role from URL path
  const getCurrentRole = () => {
    if (location.pathname.includes('/counsellor/')) return 'counsellor';
    if (location.pathname.includes('/class-advisor/')) return 'class_advisor';
    if (location.pathname.includes('/faculty/')) return 'faculty';
    if (location.pathname.includes('/hod/')) return 'hod';
    if (location.pathname.includes('/library/')) return 'library';
    if (location.pathname.includes('/hostel/')) return 'hostel';
    if (location.pathname.includes('/lab-instructor/')) return 'lab_instructor';
    if (location.pathname.includes('/college-office/')) return 'college_office';
    return null;
  };

  const currentRole = getCurrentRole();

  // Filter notifications by role context
  const roleFilteredNotifications = notifications.filter(n => {
    if (!currentRole) return true; // Show all for admin/student
    
    const title = n.title.toLowerCase();
    const message = n.message.toLowerCase();
    
    // Match notifications to roles based on title and message content
    if (currentRole === 'counsellor') {
      // Only show actionable counsellor notifications (ready for verification)
      return title.includes('ready for counsellor verification') || 
             title === 'application ready for counsellor verification';
    }
    if (currentRole === 'class_advisor') {
      // Only show actionable class advisor notifications
      return title.includes('ready for class advisor verification') ||
             title === 'application ready for class advisor verification';
    }
    if (currentRole === 'faculty') {
      return title.includes('faculty') && !title.includes('counsellor') && !title.includes('class advisor');
    }
    if (currentRole === 'hod') {
      return title.includes('hod') || message.includes('hod');
    }
    if (currentRole === 'library') {
      return title.includes('library') || message.includes('library');
    }
    if (currentRole === 'hostel') {
      return title.includes('hostel') || message.includes('hostel');
    }
    if (currentRole === 'lab_instructor') {
      return title.includes('lab') || message.includes('lab');
    }
    if (currentRole === 'college_office') {
      return title.includes('college office') || message.includes('college office');
    }
    
    return true;
  });

  const filteredNotifications = roleFilteredNotifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = roleFilteredNotifications.filter(n => !n.read).length;

  const handleDelete = () => {
    if (deleteId) {
      deleteNotification(deleteId);
      setDeleteId(null);
    }
  };

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Notifications" />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                : 'You\'re all caught up!'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="mt-6">
                {loading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No {filter === 'all' ? '' : filter} notifications</p>
                    <p className="text-sm mt-2">
                      {filter === 'all' 
                        ? "We'll notify you when something important happens"
                        : `You don't have any ${filter} notifications`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colorClass = getNotificationColor(notification.type);
                      const badgeVariant = getNotificationBadgeVariant(notification.type);
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${
                            !notification.read ? 'bg-accent/30 border-primary/20' : 'border-border'
                          }`}
                          onClick={() => handleNotificationClick(notification.id, notification.read)}
                        >
                          <div className="flex gap-4">
                            <Icon className={`h-6 w-6 ${colorClass} flex-shrink-0 mt-1`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground">
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                    )}
                                  </div>
                                  <Badge variant={badgeVariant} className="text-xs">
                                    {notification.type}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(notification.id);
                                  }}
                                  className="flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              
                              <p className="text-sm text-foreground mb-3">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatNotificationTime(notification.created_at)}</span>
                                {notification.read && notification.read_at && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Read
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Notifications;

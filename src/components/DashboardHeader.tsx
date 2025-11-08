import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useState } from "react";

interface DashboardHeaderProps {
  user: any;
  title: string;
  showNotifications?: boolean;
}

const DashboardHeader = ({ user, title, showNotifications = true }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                N
              </div>
              <span className="font-bold text-xl">NodeX</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {showNotifications && (
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
                </PopoverContent>
              </Popover>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">{user?.name || 'Admin'}</div>
                    <div className="text-xs text-muted-foreground">{user?.role || 'Administrator'}</div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => {
                  const role = user?.role || 'admin';
                  if (role === 'student') {
                    navigate('/student/profile');
                  } else if (role === 'admin') {
                    navigate('/admin/profile');
                  } else {
                    navigate('/staff/profile');
                  }
                }}>
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const role = user?.role || 'admin';
                  if (role === 'student') {
                    navigate('/student/edit-profile');
                  } else if (role === 'admin') {
                    navigate('/admin/profile/edit');
                  } else {
                    navigate('/staff/edit-profile');
                  }
                }}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

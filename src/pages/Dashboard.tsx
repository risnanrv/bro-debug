import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, User, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchComplaints = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('student_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComplaints(data);
    }
    setLoadingComplaints(false);
  };

  const fetchUnreadCount = async () => {
    const { data: announcements } = await supabase
      .from('announcements')
      .select('id');

    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('student_id', user?.id);

    if (announcements && reads) {
      const readIds = new Set(reads.map((r) => r.announcement_id));
      const unread = announcements.filter((a) => !readIds.has(a.id)).length;
      setUnreadCount(unread);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-muted text-muted-foreground';
      case 'In Progress':
        return 'bg-secondary text-secondary-foreground';
      case 'Resolved':
        return 'bg-primary text-primary-foreground';
      case 'Escalated':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-destructive text-destructive-foreground';
      case 'Urgent':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">BroDebug Support</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/updates')}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome, {profile.full_name}</h2>
            <p className="text-muted-foreground">
              {profile.batch_name} • {profile.learning_track}
            </p>
          </div>
          <Button onClick={() => navigate('/complaint/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Complaint
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Complaints</CardTitle>
              <CardDescription>Track and manage your submitted complaints</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComplaints ? (
                <p className="text-muted-foreground">Loading complaints...</p>
              ) : complaints.length === 0 ? (
                <p className="text-muted-foreground">No complaints yet. Create your first one!</p>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className="cursor-pointer hover-lift"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">{complaint.title}</h3>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(complaint.priority)}>
                              {complaint.priority}
                            </Badge>
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {complaint.description.substring(0, 100)}
                          {complaint.description.length > 100 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{complaint.category}</span>
                          <span>•</span>
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

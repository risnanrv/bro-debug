import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, User, Bell } from 'lucide-react';
import Header from '@/components/Header';

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
      // Sort complaints by priority and status
      const sortedComplaints = data.sort((a, b) => {
        const statusOrder: Record<string, number> = {
          'Escalated': 1,
          'In Progress': 2,
          'Pending': 3,
          'Resolved': 4,
          'Closed': 5,
        };
        const priorityOrder: Record<string, number> = {
          'Critical': 1,
          'Urgent': 2,
          'Normal': 3,
        };

        // First sort by status
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Then by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setComplaints(sortedComplaints);
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
      <Header role="student" />
      
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/updates')}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-2" />
            Updates
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              Welcome back, <span className="text-primary">{profile.full_name}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {profile.batch_name && `${profile.batch_name} • `}
              {profile.learning_track || 'Brototype Student'}
            </p>
          </div>
          <Button onClick={() => navigate('/complaint/new')} size="lg" className="gap-2 hover-lift">
            <Plus className="h-5 w-5" />
            New Complaint
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="gradient-card border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Your Complaints</CardTitle>
              <CardDescription className="text-base">Track and manage your submitted complaints</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComplaints ? (
                <p className="text-muted-foreground">Loading complaints...</p>
              ) : complaints.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">No complaints yet.</p>
                  <Button onClick={() => navigate('/complaint/new')} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first one
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className={`cursor-pointer hover-lift border-border/50 transition-all ${
                      complaint.status === 'Resolved' || complaint.status === 'Closed'
                        ? 'opacity-50 hover:opacity-70'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl">{complaint.title}</h3>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          <Badge variant="outline" className="border-current" style={{
                            color: complaint.priority === 'Critical' ? 'hsl(var(--primary))' :
                                   complaint.priority === 'Urgent' ? 'hsl(var(--accent))' :
                                   'hsl(var(--muted-foreground))'
                          }}>
                            {complaint.priority}
                          </Badge>
                          <Badge variant="outline" className="border-current" style={{
                            color: complaint.status === 'Escalated' ? 'hsl(var(--status-escalated))' :
                                   complaint.status === 'In Progress' ? 'hsl(var(--status-in-progress))' :
                                   complaint.status === 'Resolved' ? 'hsl(var(--status-resolved))' :
                                   'hsl(var(--muted-foreground))'
                          }}>
                            {complaint.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {complaint.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{complaint.custom_category_text || complaint.category}</span>
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

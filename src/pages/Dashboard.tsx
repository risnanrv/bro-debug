import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogOut, User, Bell } from 'lucide-react';
import ProgressStepper from '@/components/ProgressStepper';
import AnnouncementPreview from '@/components/AnnouncementPreview';
import brototypeLogo from '@/assets/brototype-logo-new.png';

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchUnreadCount();
      fetchUnreadMessages();
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

  const fetchUnreadMessages = async () => {
    const { data: userComplaints } = await supabase
      .from('complaints')
      .select('id')
      .eq('student_id', user?.id);

    if (!userComplaints) return;

    const complaintIds = userComplaints.map(c => c.id);
    const { data: messages } = await supabase
      .from('complaint_messages')
      .select('complaint_id')
      .in('complaint_id', complaintIds)
      .eq('sender_role', 'admin')
      .eq('read_by_student', false);

    if (messages) {
      const counts: Record<string, number> = {};
      messages.forEach(msg => {
        counts[msg.complaint_id] = (counts[msg.complaint_id] || 0) + 1;
      });
      setUnreadMessages(counts);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'hsl(var(--primary))';
      case 'Urgent':
        return 'hsl(var(--accent))';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Escalated':
        return 'hsl(var(--status-escalated))';
      case 'In Progress':
        return 'hsl(var(--status-in-progress))';
      case 'Resolved':
        return 'hsl(var(--status-resolved))';
      case 'Closed':
        return 'hsl(var(--status-closed))';
      default:
        return 'hsl(var(--muted-foreground))';
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const activeComplaints = complaints
    .filter((c) => ['Pending', 'In Progress', 'Escalated'].includes(c.status))
    .sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'Escalated': 1,
        'In Progress': 2,
        'Pending': 3,
      };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const historyComplaints = complaints
    .filter((c) => ['Resolved', 'Closed'].includes(c.status))
    .sort((a, b) => {
      if (a.status === 'Resolved' && b.status === 'Closed') return -1;
      if (a.status === 'Closed' && b.status === 'Resolved') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src={brototypeLogo} 
                alt="Brototype" 
                className="logo-size pl-3 pt-1"
              />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/updates')}
              className="text-sm font-medium flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Updates</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="text-sm font-medium flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            {/* Active Complaints Section */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Active Complaints</h3>
              {loadingComplaints ? (
                <p className="text-muted-foreground">Loading complaints...</p>
              ) : activeComplaints.length === 0 ? (
                <Card className="gradient-card border-border/50">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center py-8">No active complaints</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeComplaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className="cursor-pointer hover-lift border-border/50 transition-all hover:border-primary/50 gradient-card shadow-lg"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 flex items-start gap-2">
                            <h3 className="font-bold text-xl">{complaint.title}</h3>
                            {unreadMessages[complaint.id] && (
                              <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                                {unreadMessages[complaint.id]} new
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <Badge
                              variant="outline"
                              className="border-current"
                              style={{ color: getPriorityColor(complaint.priority) }}
                            >
                              {complaint.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-current"
                              style={{ color: getStatusColor(complaint.status) }}
                            >
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="mb-4">
                          <ProgressStepper status={complaint.status} />
                        </div>
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
            </div>

            {/* History Section */}
            {historyComplaints.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4 text-muted-foreground">History — Resolved & Closed</h3>
                <div className="space-y-4">
                  {historyComplaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className="cursor-pointer hover-lift border-border/50 transition-all opacity-60 hover:opacity-80"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg flex-1">{complaint.title}</h3>
                          <div className="flex gap-2 flex-shrink-0 ml-4">
                            <Badge
                              variant="outline"
                              className="border-current text-xs"
                              style={{ color: getStatusColor(complaint.status) }}
                            >
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                          {complaint.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{complaint.custom_category_text || complaint.category}</span>
                          <span>•</span>
                          <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {complaints.length === 0 && !loadingComplaints && (
              <Card className="gradient-card border-border/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Complaints</CardTitle>
                  <CardDescription className="text-base">Track and manage your submitted complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg mb-4">No complaints yet.</p>
                    <Button onClick={() => navigate('/complaint/new')} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first one
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Announcement Preview - Right Side */}
          <div className="lg:col-span-1">
            <AnnouncementPreview userId={user?.id || ''} />
          </div>
        </div>
      </main>
    </div>
  );
}

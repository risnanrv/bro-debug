import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, MessageCircle, XCircle, RotateCcw, Bell, LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ComplaintTimeline from '@/components/ComplaintTimeline';
import brototypeLogo from '@/assets/brototype-logo-new.png';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchNotes();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

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

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setComplaint(data);
    }
    setLoading(false);
  };

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('resolution_notes')
      .select('*')
      .eq('complaint_id', id)
      .eq('type', 'public')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setNotes(data);
    }
  };

  const handleRefresh = () => {
    fetchComplaint();
    fetchNotes();
    toast({
      title: 'Refreshed',
      description: 'Complaint data has been refreshed',
    });
  };

  const handleReopen = async () => {
    const { error } = await supabase
      .from('complaints')
      .update({ status: 'In Progress', satisfaction: null })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Complaint reopened',
      description: 'Your complaint has been reopened',
    });

    fetchComplaint();
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

  if (loading || !complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const timelineEvents: Array<{
    icon: 'pin' | 'clock' | 'message' | 'check' | 'reopen' | 'escalate';
    title: string;
    description?: string;
    timestamp: string;
    isActive: boolean;
  }> = [
    {
      icon: 'pin',
      title: 'Complaint Submitted',
      description: complaint.description,
      timestamp: new Date(complaint.created_at).toLocaleString(),
      isActive: true,
    },
  ];

  if (complaint.status !== 'Pending') {
    timelineEvents.push({
      icon: 'clock',
      title: 'Status changed to "In Progress"',
      description: undefined,
      timestamp: new Date(complaint.updated_at).toLocaleString(),
      isActive: true,
    });
  }

  if (complaint.status === 'Escalated') {
    timelineEvents.push({
      icon: 'escalate',
      title: 'Complaint Escalated',
      description: 'This complaint has been escalated due to extended processing time.',
      timestamp: new Date(complaint.updated_at).toLocaleString(),
      isActive: true,
    });
  }

  notes.forEach((note) => {
    timelineEvents.push({
      icon: 'message',
      title: 'Admin replied',
      description: note.message,
      timestamp: new Date(note.created_at).toLocaleString(),
      isActive: true,
    });
  });

  if (complaint.status === 'Resolved') {
    timelineEvents.push({
      icon: 'check',
      title: 'Status changed to "Resolved"',
      description: undefined,
      timestamp: complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : '',
      isActive: true,
    });
  }

  if (complaint.status === 'Closed') {
    timelineEvents.push({
      icon: 'check',
      title: 'Status changed to "Closed"',
      description: complaint.satisfaction ? `Student marked as: ${complaint.satisfaction}` : undefined,
      timestamp: complaint.closed_at ? new Date(complaint.closed_at).toLocaleString() : new Date(complaint.updated_at).toLocaleString(),
      isActive: true,
    });
  }

  if (complaint.status === 'Pending' || complaint.status === 'In Progress') {
    timelineEvents.push({
      icon: 'check',
      title: 'Resolved',
      description: undefined,
      timestamp: 'Pending',
      isActive: false,
    });
    timelineEvents.push({
      icon: 'check',
      title: 'Closed',
      description: undefined,
      timestamp: 'Pending',
      isActive: false,
    });
  } else if (complaint.status === 'Resolved') {
    timelineEvents.push({
      icon: 'check',
      title: 'Closed',
      description: undefined,
      timestamp: 'Pending',
      isActive: false,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
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
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Button>
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
              onClick={() => {
                supabase.auth.signOut();
                navigate('/auth');
              }}
              className="text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title Block */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold flex-1">{complaint.title}</h1>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <Badge
                variant="outline"
                className="border-current text-sm"
                style={{ color: getPriorityColor(complaint.priority) }}
              >
                {complaint.priority}
              </Badge>
              <Badge
                variant="outline"
                className="border-current text-sm"
                style={{ color: getStatusColor(complaint.status) }}
              >
                {complaint.status}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Created on: {new Date(complaint.created_at).toLocaleString()} | Category: {complaint.custom_category_text || complaint.category}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timeline - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="gradient-card border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplaintTimeline events={timelineEvents} />
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Submitted By Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Submitted By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <p className="font-medium">{complaint.student_name_cached}</p>
                </div>
                {profile?.batch_name && (
                  <div>
                    <span className="text-muted-foreground">Batch:</span>
                    <p className="font-medium">{profile.batch_name}</p>
                  </div>
                )}
                {profile?.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{profile.location}</p>
                  </div>
                )}
                {profile?.mode && (
                  <div>
                    <span className="text-muted-foreground">Mode:</span>
                    <p className="font-medium">{profile.mode}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Response Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Admin Response</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No response from admin yet. You will receive an update soon.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm mb-2 whitespace-pre-wrap">{notes[notes.length - 1].message}</p>
                      <p className="text-xs text-muted-foreground">
                        Responded on: {new Date(notes[notes.length - 1].created_at).toLocaleString()}
                      </p>
                    </div>
                    {notes.length > 1 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {notes.length - 1} previous response{notes.length - 1 > 1 ? 's' : ''} in timeline above
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <Separator className="my-8" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          
          {(complaint.status === 'Pending' || complaint.status === 'In Progress') && (
            <>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Ask for Clarification
              </Button>
              <Button variant="outline" className="gap-2">
                <XCircle className="h-4 w-4" />
                Request to Close
              </Button>
            </>
          )}
          
          {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
            <Button onClick={handleReopen} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reopen Complaint
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LogOut, Filter, Bell, Grid, Clock, PlayCircle, CheckCircle, AlertTriangle, Search, Eye } from 'lucide-react';
import ProgressStepper from '@/components/ProgressStepper';
import { formatDistanceToNow } from 'date-fns';
import brototypeLogo from '@/assets/brototype-logo-new.png';

export default function AdminDashboard() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
  });

  const [filters, setFilters] = useState({
    status: 'all' as string,
    priority: 'all' as string,
    category: 'all' as string,
  });
  
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchComplaints();
      fetchUnreadMessages();
    }
  }, [user, profile, filters]);

  const fetchComplaints = async () => {
    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status as any);
    }
    if (filters.priority !== 'all') {
      query = query.eq('priority', filters.priority as any);
    }
    if (filters.category !== 'all') {
      query = query.eq('category', filters.category as any);
    }

    const { data, error } = await query;

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
      
      // Calculate stats
      const totalComplaints = data.length;
      const pending = data.filter((c) => c.status === 'Pending').length;
      const inProgress = data.filter((c) => c.status === 'In Progress').length;
      const resolved = data.filter((c) => c.status === 'Resolved').length;
      const escalated = data.filter((c) => c.status === 'Escalated').length;

      setStats({
        total: totalComplaints,
        pending,
        inProgress,
        resolved,
        escalated,
      });
    }
    setLoadingComplaints(false);
  };

  const fetchUnreadMessages = async () => {
    const { data: messages } = await supabase
      .from('complaint_messages')
      .select('complaint_id')
      .eq('sender_role', 'student')
      .eq('read_by_admin', false);

    if (messages) {
      const counts: Record<string, number> = {};
      messages.forEach(msg => {
        counts[msg.complaint_id] = (counts[msg.complaint_id] || 0) + 1;
      });
      setUnreadMessages(counts);
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

  const getFilteredComplaints = () => {
    let filtered = complaints;

    // Apply active/history tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(c => ['Pending', 'In Progress', 'Escalated'].includes(c.status));
    } else {
      filtered = filtered.filter(c => ['Resolved', 'Closed'].includes(c.status));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.student_name_cached.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.custom_category_text && c.custom_category_text.toLowerCase().includes(query))
      );
    }

    // Apply quick filters
    if (quickFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => new Date(c.created_at) >= today);
    } else if (quickFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(c => new Date(c.created_at) >= weekAgo);
    } else if (quickFilter === 'escalated') {
      filtered = filtered.filter(c => c.status === 'Escalated');
    }

    return filtered;
  };

  const filteredComplaints = getFilteredComplaints();

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/admin')}
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
              onClick={() => navigate('/admin/announcements')}
              className="text-sm font-medium flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Announcements</span>
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
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            Admin <span className="text-primary">Dashboard</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Monitor and resolve student complaints across Brototype
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="gradient-card border-border/50 hover-lift hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Grid className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift hover:shadow-lg hover:shadow-accent/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <CardTitle className="text-sm font-medium text-accent uppercase tracking-wide">
                  Pending
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift hover:shadow-lg hover:shadow-status-in-progress/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-status-in-progress" />
                <CardTitle className="text-sm font-medium text-status-in-progress uppercase tracking-wide">
                  In Progress
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-status-in-progress">{stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift hover:shadow-lg hover:shadow-status-resolved/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-status-resolved" />
                <CardTitle className="text-sm font-medium text-status-resolved uppercase tracking-wide">
                  Resolved
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-status-resolved">{stats.resolved}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift hover:shadow-lg hover:shadow-primary/20 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium text-primary uppercase tracking-wide">
                  Escalated
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.escalated}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-xl">Search & Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, student name, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Hostel / Accommodation">Hostel / Accommodation</SelectItem>
                  <SelectItem value="Mentor Behavior / Staff Attitude">Mentor Behavior / Staff Attitude</SelectItem>
                  <SelectItem value="Curriculum / Teaching">Curriculum / Teaching</SelectItem>
                  <SelectItem value="Batch Management">Batch Management</SelectItem>
                  <SelectItem value="Laptop / Lab / Internet / Wi-Fi Issue">Laptop / Lab / Internet / Wi-Fi Issue</SelectItem>
                  <SelectItem value="Payment / Finance">Payment / Finance</SelectItem>
                  <SelectItem value="Food / Canteen">Food / Canteen</SelectItem>
                  <SelectItem value="Mental Health / Harassment / Bullying">Mental Health / Harassment / Bullying</SelectItem>
                  <SelectItem value="Miscommunication / Misleading Information">Miscommunication / Misleading Information</SelectItem>
                  <SelectItem value="Personal Safety">Personal Safety</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={quickFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(quickFilter === 'today' ? null : 'today')}
              >
                Today
              </Button>
              <Button
                variant={quickFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(quickFilter === 'week' ? null : 'week')}
              >
                Last 7 days
              </Button>
              <Button
                variant={quickFilter === 'escalated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter(quickFilter === 'escalated' ? null : 'escalated')}
              >
                Escalated Only
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'active' ? 'default' : 'outline'}
              onClick={() => setActiveTab('active')}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Active
              <Badge variant="secondary" className="ml-1">
                {stats.pending + stats.inProgress + stats.escalated}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              onClick={() => setActiveTab('history')}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              History
              <Badge variant="secondary" className="ml-1">
                {stats.resolved + (complaints.filter(c => c.status === 'Closed').length)}
              </Badge>
            </Button>
          </div>

          <Card className="gradient-card border-border/50 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/announcements')}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Announcements</span>
            </Button>
          </Card>
        </div>

        <Card className="gradient-card border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {activeTab === 'active' ? 'Active Complaints' : 'History — Resolved & Closed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingComplaints ? (
              <p className="text-muted-foreground">Loading complaints...</p>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No complaints found with these filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => {
                  const isHistory = complaint.status === 'Resolved' || complaint.status === 'Closed';
                  const complaintAge = formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true });
                  
                  return (
                    <Card
                      key={complaint.id}
                      className={`group cursor-pointer hover-lift border-border/50 transition-all relative ${
                        isHistory
                          ? 'opacity-60 hover:opacity-80'
                          : 'hover:border-primary/50 hover:shadow-lg'
                      }`}
                      onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-1">
                              <h3 className="font-bold text-xl">{complaint.title}</h3>
                              {unreadMessages[complaint.id] && (
                                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                                  {unreadMessages[complaint.id]} new
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By: <span className="font-medium">{complaint.student_name_cached}</span>
                            </p>
                          </div>
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
                            {complaint.close_requested && (
                              <Badge variant="outline" className="border-accent text-accent">
                                Close Request
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {complaint.description}
                        </p>

                        <div className="mb-4">
                          <ProgressStepper status={complaint.status} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="font-medium">{complaint.custom_category_text || complaint.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {complaintAge}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/complaint/${complaint.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            View & Update
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

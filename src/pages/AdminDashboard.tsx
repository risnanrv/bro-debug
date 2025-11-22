import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Filter, Bell } from 'lucide-react';
import Header from '@/components/Header';

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
      <Header role="admin" />
      
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/announcements')}
          >
            <Bell className="h-4 w-4 mr-2" />
            Announcements
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

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
          <Card className="gradient-card border-border/50 hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-accent uppercase tracking-wide">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-status-in-progress uppercase tracking-wide">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-status-in-progress">{stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-status-resolved uppercase tracking-wide">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-status-resolved">{stats.resolved}</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 hover-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary uppercase tracking-wide">
                Escalated
              </CardTitle>
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
              <CardTitle className="text-xl">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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
              </div>

              <div>
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
              </div>

              <div>
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
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">All Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingComplaints ? (
              <p className="text-muted-foreground">Loading complaints...</p>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No complaints found with these filters</p>
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
                    onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl mb-1">{complaint.title}</h3>
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
      </main>
    </div>
  );
}

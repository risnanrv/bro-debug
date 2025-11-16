import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Filter } from 'lucide-react';

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
      setComplaints(data);
      
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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Complaints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.resolved}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Escalated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.escalated}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
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
                    <SelectItem value="Mentor Behavior">Mentor Behavior</SelectItem>
                    <SelectItem value="Curriculum / Teaching">Curriculum / Teaching</SelectItem>
                    <SelectItem value="Technical Support">Technical Support</SelectItem>
                    <SelectItem value="Laptop / Lab Issue">Laptop / Lab Issue</SelectItem>
                    <SelectItem value="Payment & Finance">Payment & Finance</SelectItem>
                    <SelectItem value="Food / Canteen">Food / Canteen</SelectItem>
                    <SelectItem value="Mental Health / Harassment">Mental Health / Harassment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingComplaints ? (
              <p className="text-muted-foreground">Loading complaints...</p>
            ) : complaints.length === 0 ? (
              <p className="text-muted-foreground">No complaints found</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="cursor-pointer hover-lift"
                    onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{complaint.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            By: {complaint.student_name_cached}
                          </p>
                        </div>
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
                        {complaint.description.substring(0, 150)}
                        {complaint.description.length > 150 ? '...' : ''}
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
      </main>
    </div>
  );
}

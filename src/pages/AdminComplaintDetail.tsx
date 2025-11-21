import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchResponses();
    }
  }, [id]);

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setComplaint(data);
      setNewStatus(data.status);
      setNewPriority(data.priority);
    }
    setLoading(false);
  };

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('resolution_notes')
      .select('*')
      .eq('complaint_id', id)
      .eq('type', 'public')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setResponses(data);
    }
  };

  const handleUpdateStatus = async () => {
    const updates: any = { status: newStatus, priority: newPriority };
    
    if (newStatus === 'Closed') {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('complaints')
      .update(updates)
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
      title: 'Updated',
      description: 'Complaint status and priority updated',
    });

    fetchComplaint();
  };

  const handleUpdateComplaint = async () => {
    if (!newResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Response cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    const updates: any = { status: newStatus, priority: newPriority };
    
    if (newStatus === 'Closed') {
      updates.closed_at = new Date().toISOString();
    }

    // Update complaint
    const { error: complaintError } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id);

    if (complaintError) {
      toast({
        title: 'Error',
        description: complaintError.message,
        variant: 'destructive',
      });
      return;
    }

    // Add response
    const { error: responseError } = await supabase.from('resolution_notes').insert({
      complaint_id: id,
      admin_id: user?.id,
      type: 'public',
      message: newResponse,
    });

    if (responseError) {
      toast({
        title: 'Error',
        description: responseError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Updated',
      description: 'Complaint has been updated successfully',
    });

    setNewResponse('');
    fetchComplaint();
    fetchResponses();
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

  if (loading || !complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{complaint.title}</CardTitle>
                    <div className="flex gap-2 mb-4">
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                      <Badge variant="outline">{complaint.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Submitted by:</span>
                    <p className="font-medium">{complaint.student_name_cached}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted on:</span>
                    <p className="font-medium">
                      {new Date(complaint.created_at).toLocaleString()}
                    </p>
                  </div>
                  {complaint.satisfaction && (
                    <div>
                      <span className="text-muted-foreground">Satisfaction:</span>
                      <p className="font-medium capitalize">{complaint.satisfaction}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Previous Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <Card key={response.id}>
                        <CardContent className="pt-6">
                          <p className="text-xs text-muted-foreground mb-2">
                            {new Date(response.created_at).toLocaleString()}
                          </p>
                          <p className="whitespace-pre-wrap">{response.message}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Complaint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Response / Instruction for Student</Label>
                  <Textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Type your response to the student..."
                    className="min-h-[150px]"
                  />
                </div>

                <Button onClick={handleUpdateComplaint} className="w-full">
                  Update & Send Response
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

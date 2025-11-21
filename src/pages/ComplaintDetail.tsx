import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchNotes();
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

  const handleSatisfaction = async (satisfied: boolean) => {
    const { error } = await supabase
      .from('complaints')
      .update({ 
        satisfaction: satisfied ? 'satisfied' : 'unsatisfied',
        status: satisfied ? 'Closed' : 'In Progress'
      })
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
      title: satisfied ? 'Thank you!' : 'Complaint reopened',
      description: satisfied 
        ? 'Your feedback has been recorded' 
        : 'Your complaint has been reopened for further review',
    });

    fetchComplaint();
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
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
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
            </div>

            {notes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">Admin Responses</h3>
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <Card key={note.id} className="bg-muted/50">
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground mb-2">
                            Admin • {new Date(note.created_at).toLocaleString()}
                          </p>
                          <p className="whitespace-pre-wrap">{note.message}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            {complaint.status === 'Resolved' && !complaint.satisfaction && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">Are you satisfied with the resolution?</h3>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleSatisfaction(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Satisfied
                    </Button>
                    <Button
                      onClick={() => handleSatisfaction(false)}
                      variant="outline"
                      className="gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not Satisfied
                    </Button>
                  </div>
                </div>
              </>
            )}

            {complaint.status === 'Closed' && complaint.satisfaction && (
              <div className="text-sm text-muted-foreground">
                You marked this as: {complaint.satisfaction === 'satisfied' ? '✓ Satisfied' : '✗ Not Satisfied'}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ArrowLeft, Calendar, User, MapPin, GraduationCap, MessageSquare, Bell, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ComplaintTimeline, { TimelineEvent } from '@/components/ComplaintTimeline';
import { formatDistanceToNow } from 'date-fns';
import brototypeLogo from '@/assets/brototype-logo-new.png';

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
  const [logAsTimeline, setLogAsTimeline] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);

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

  const fetchStudentProfile = async (studentId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!error && data) {
      setStudentProfile(data);
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
      setNewStatus(data.status);
      setNewPriority(data.priority);
      fetchStudentProfile(data.student_id);
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

    // Check if status is being changed to Resolved or Closed
    if ((newStatus === 'Resolved' || newStatus === 'Closed') && complaint.status !== newStatus) {
      setShowConfirmDialog(true);
      return;
    }

    await performUpdate();
  };

  const performUpdate = async () => {
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
    setShowConfirmDialog(false);
    fetchComplaint();
    fetchResponses();
  };

  const quickResponses = [
    "We are checking this with the respective team.",
    "Issue resolved. Please confirm if it's working fine now.",
    "We need more details. Please update with specific time and location.",
    "Your complaint has been forwarded to the management team.",
  ];

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

  const buildTimeline = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Complaint submitted
    events.push({
      icon: 'pin',
      title: 'Complaint Submitted',
      description: `By ${complaint.student_name_cached}`,
      timestamp: new Date(complaint.created_at).toLocaleString(),
      isActive: true,
    });

    // Status changes from responses
    if (complaint.status === 'In Progress' || complaint.status === 'Resolved' || complaint.status === 'Closed') {
      events.push({
        icon: 'clock',
        title: 'Status changed to "In Progress"',
        description: 'Admin team is working on this complaint',
        timestamp: complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : '',
        isActive: true,
      });
    }

    // Admin responses
    responses.forEach((response) => {
      events.push({
        icon: 'message',
        title: 'Admin Response',
        description: response.message,
        timestamp: new Date(response.created_at).toLocaleString(),
        isActive: true,
      });
    });

    // Resolved
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
      events.push({
        icon: 'check',
        title: 'Status changed to "Resolved"',
        timestamp: complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : '',
        isActive: true,
      });
    }

    // Closed
    if (complaint.status === 'Closed' && complaint.closed_at) {
      events.push({
        icon: 'check',
        title: 'Complaint Closed',
        timestamp: new Date(complaint.closed_at).toLocaleString(),
        isActive: true,
      });
    }

    // Escalated
    if (complaint.status === 'Escalated') {
      events.push({
        icon: 'escalate',
        title: 'Complaint Escalated',
        description: 'Complaint has been escalated to higher management',
        timestamp: complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : '',
        isActive: true,
      });
    }

    return events;
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
      {/* Unified Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src={brototypeLogo} 
                alt="Brototype" 
                className="h-12 w-auto"
              />
            </button>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Button>
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

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Case Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Block */}
            <Card className="gradient-card border-border/50">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold mb-3">{complaint.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-3">
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
                  <p className="text-sm text-muted-foreground">
                    Created on: {new Date(complaint.created_at).toLocaleString()} | 
                    Category: {complaint.custom_category_text || complaint.category} | 
                    ID: #{complaint.id.slice(0, 8)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Case Timeline */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Case Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplaintTimeline events={buildTimeline()} />
              </CardContent>
            </Card>

            {/* Description Card */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {complaint.description}
                </p>
              </CardContent>
            </Card>

            {/* Student Info Card */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Submitted By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Student Name</p>
                    <p className="font-semibold">{complaint.student_name_cached}</p>
                  </div>
                  {studentProfile?.batch_name && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Batch</p>
                      <p className="font-semibold flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {studentProfile.batch_name}
                      </p>
                    </div>
                  )}
                  {studentProfile?.location && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-semibold flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {studentProfile.location}
                      </p>
                    </div>
                  )}
                  {studentProfile?.mode && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Mode</p>
                      <p className="font-semibold">{studentProfile.mode}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Admin Response Card */}
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl">Latest Admin Response</CardTitle>
              </CardHeader>
              <CardContent>
                {responses.length > 0 ? (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Responded on: {new Date(responses[responses.length - 1].created_at).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {responses[responses.length - 1].message}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No admin response has been sent yet.</p>
                    <p className="text-sm">Use the panel on the right to respond.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Update Panel */}
          <div className="space-y-6">
            <Card className="gradient-card border-border/50 sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Update Complaint</CardTitle>
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

                <Separator />

                <div className="space-y-2">
                  <Label>Quick Response Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickResponses.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setNewResponse(preset)}
                        className="text-xs"
                      >
                        {preset.slice(0, 30)}...
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Response / Instruction for Student</Label>
                  <Textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Type your response to the student..."
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be visible to the student in their complaint view.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timeline"
                    checked={logAsTimeline}
                    onCheckedChange={(checked) => setLogAsTimeline(checked as boolean)}
                  />
                  <label
                    htmlFor="timeline"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Log this response as a timeline event
                  </label>
                </div>

                <Button onClick={handleUpdateComplaint} className="w-full" size="lg">
                  Update & Send Response
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this complaint as {newStatus}?
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-semibold text-foreground">{complaint.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Student: {complaint.student_name_cached}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    New Status: <span className="font-semibold">{newStatus}</span>
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={performUpdate}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

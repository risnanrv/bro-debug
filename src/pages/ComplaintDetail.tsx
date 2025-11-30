import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, RefreshCw, MessageCircle, XCircle, RotateCcw, Bell, LogOut, User, ThumbsUp, ThumbsDown, FileText, Image as ImageIcon, Video } from 'lucide-react';
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
  const [showClarificationDialog, setShowClarificationDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [showSatisfactionDialog, setShowSatisfactionDialog] = useState(false);
  const [satisfactionFeedback, setSatisfactionFeedback] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchNotes();
    }
  }, [id]);

  useEffect(() => {
    if (complaint?.attachments && complaint.attachments.length > 0) {
      generateSignedUrls();
    }
  }, [complaint?.attachments]);

  const generateSignedUrls = async () => {
    if (!complaint?.attachments) return;
    
    const urls: Record<string, string> = {};
    for (const attachment of complaint.attachments) {
      // Extract the path from the URL if it's a full URL
      const path = attachment.includes('complaint-attachments/') 
        ? attachment.split('complaint-attachments/')[1].split('?')[0]
        : attachment;
      
      const { data, error } = await supabase.storage
        .from('complaint-attachments')
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (!error && data) {
        urls[attachment] = data.signedUrl;
      }
    }
    setSignedUrls(urls);
  };

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
      .in('type', ['public', 'clarification_request', 'close_request'])
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
      .update({ status: 'In Progress', satisfaction: null, close_requested: false })
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

  const handleAskClarification = async () => {
    if (!clarificationMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your clarification request',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('resolution_notes').insert({
      complaint_id: id,
      admin_id: user?.id,
      type: 'clarification_request',
      message: clarificationMessage,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Clarification sent',
      description: 'Your clarification request has been sent to the admin',
    });

    setClarificationMessage('');
    setShowClarificationDialog(false);
    fetchNotes();
  };

  const handleSatisfactionResponse = async (satisfied: boolean) => {
    if (!satisfied && !satisfactionFeedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please share why you are not satisfied',
        variant: 'destructive',
      });
      return;
    }

    // Set satisfaction
    const { error: satError } = await supabase
      .from('complaints')
      .update({ satisfaction: satisfied ? 'satisfied' : 'unsatisfied' })
      .eq('id', id);

    if (satError) {
      toast({
        title: 'Error',
        description: satError.message,
        variant: 'destructive',
      });
      return;
    }

    if (!satisfied) {
      // Insert feedback note
      const { error: noteError } = await supabase.from('resolution_notes').insert({
        complaint_id: id,
        admin_id: user?.id,
        type: 'feedback_unsatisfied',
        message: satisfactionFeedback,
      });

      if (noteError) {
        toast({
          title: 'Error',
          description: noteError.message,
          variant: 'destructive',
        });
        return;
      }

      // Reopen complaint
      const { error: reopenError } = await supabase
        .from('complaints')
        .update({ status: 'In Progress' })
        .eq('id', id);

      if (reopenError) {
        toast({
          title: 'Error',
          description: reopenError.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Feedback submitted',
        description: 'Your complaint has been reopened for further review',
      });
    } else {
      toast({
        title: 'Thank you',
        description: 'Your feedback has been recorded',
      });
    }

    setSatisfactionFeedback('');
    setShowSatisfactionDialog(false);
    fetchComplaint();
    fetchNotes();
  };

  const handleRequestClose = async () => {
    const { error: noteError } = await supabase.from('resolution_notes').insert({
      complaint_id: id,
      admin_id: user?.id,
      type: 'close_request',
      message: closeNote.trim() || 'Student has requested to close this complaint',
    });

    if (noteError) {
      toast({
        title: 'Error',
        description: noteError.message,
        variant: 'destructive',
      });
      return;
    }

    const { error: complaintError } = await supabase
      .from('complaints')
      .update({ close_requested: true })
      .eq('id', id);

    if (complaintError) {
      toast({
        title: 'Error',
        description: complaintError.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Close request sent',
      description: 'Your close request has been sent to the admin',
    });

    setCloseNote('');
    setShowCloseDialog(false);
    fetchComplaint();
    fetchNotes();
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
    if (note.type === 'clarification_request') {
      timelineEvents.push({
        icon: 'message',
        title: 'Clarification Requested',
        description: note.message,
        timestamp: new Date(note.created_at).toLocaleString(),
        isActive: true,
      });
    } else if (note.type === 'close_request') {
      timelineEvents.push({
        icon: 'message',
        title: 'Close Request Sent',
        description: note.message,
        timestamp: new Date(note.created_at).toLocaleString(),
        isActive: true,
      });
    } else {
      timelineEvents.push({
        icon: 'message',
        title: 'Admin replied',
        description: note.message,
        timestamp: new Date(note.created_at).toLocaleString(),
        isActive: true,
      });
    }
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
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

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

            {/* Attachments Card */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {complaint.attachments.map((url: string, idx: number) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|webp)$/i);
                      const isPdf = url.match(/\.pdf$/i);
                      const isVideo = url.match(/\.mp4$/i);
                      const signedUrl = signedUrls[url] || url;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedAttachment(signedUrl)}
                          className="group relative overflow-hidden border border-border rounded-lg hover:border-primary transition-colors"
                        >
                          {isImage ? (
                            <div className="aspect-square">
                              <img 
                                src={signedUrl} 
                                alt={`Attachment ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          ) : (
                            <div className="aspect-square flex flex-col items-center justify-center gap-2 p-3">
                              {isPdf && <FileText className="h-12 w-12 text-muted-foreground" />}
                              {isVideo && <Video className="h-12 w-12 text-muted-foreground" />}
                              <span className="text-xs text-muted-foreground text-center">
                                {isPdf ? 'PDF' : 'Video'} {idx + 1}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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

        {/* Satisfaction Feedback Prompt */}
        {(complaint.status === 'Resolved' || complaint.status === 'Closed') && !complaint.satisfaction && (
          <>
            <Separator className="my-8" />
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-3">Are you satisfied with how this complaint was handled?</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSatisfactionResponse(true)}
                    variant="outline"
                    className="flex-1 gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes, I'm satisfied
                  </Button>
                  <Button
                    onClick={() => setShowSatisfactionDialog(true)}
                    variant="outline"
                    className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No, I'm not satisfied
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Quick Action Buttons */}
        <Separator className="my-8" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          
          {(complaint.status === 'Pending' || complaint.status === 'In Progress') && (
            <>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowClarificationDialog(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Ask for Clarification
              </Button>
              {!complaint.close_requested && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowCloseDialog(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Request to Close
                </Button>
              )}
              {complaint.close_requested && (
                <Button variant="outline" className="gap-2" disabled>
                  <XCircle className="h-4 w-4" />
                  Close Request Sent
                </Button>
              )}
            </>
          )}
          
          {complaint.status === 'Resolved' && !complaint.close_requested && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowCloseDialog(true)}
            >
              <XCircle className="h-4 w-4" />
              Request to Close
            </Button>
          )}
          
          {complaint.status === 'Resolved' && complaint.close_requested && (
            <Button variant="outline" className="gap-2" disabled>
              <XCircle className="h-4 w-4" />
              Close Request Sent
            </Button>
          )}
          
          {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
            <Button onClick={handleReopen} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reopen Complaint
            </Button>
          )}
        </div>
      </main>

      {/* Clarification Dialog */}
      <Dialog open={showClarificationDialog} onOpenChange={setShowClarificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask for Clarification</DialogTitle>
            <DialogDescription>
              Describe what you want the admin to clarify about this complaint.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Type your question or clarification for the admin..."
            value={clarificationMessage}
            onChange={(e) => setClarificationMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClarificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAskClarification}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Request Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Close Complaint</DialogTitle>
            <DialogDescription>
              If your issue is resolved, you can request the admin to close this complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional note (optional)</label>
            <Textarea
              placeholder="Share any final note about how this was resolved..."
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestClose}>
              Send Close Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Satisfaction Feedback Dialog */}
      <Dialog open={showSatisfactionDialog} onOpenChange={setShowSatisfactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help us improve</DialogTitle>
            <DialogDescription>
              Please share why you're not satisfied with how this complaint was handled.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Tell us what went wrong or what could be improved..."
            value={satisfactionFeedback}
            onChange={(e) => setSatisfactionFeedback(e.target.value)}
            className="min-h-[150px]"
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSatisfactionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSatisfactionResponse(false)}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Viewer Dialog */}
      <Dialog open={!!selectedAttachment} onOpenChange={() => setSelectedAttachment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Attachment</DialogTitle>
          </DialogHeader>
          {selectedAttachment && (() => {
            const originalUrl = Object.keys(signedUrls).find(key => signedUrls[key] === selectedAttachment) || selectedAttachment;
            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(originalUrl);
            const isPdf = /\.pdf$/i.test(originalUrl);
            const isVideo = /\.mp4$/i.test(originalUrl);
            
            return (
              <div className="flex items-center justify-center">
                {isImage ? (
                  <img src={selectedAttachment} alt="Attachment" className="max-w-full rounded-lg" />
                ) : isPdf ? (
                  <iframe src={selectedAttachment} className="w-full h-[70vh]" title="PDF Viewer" />
                ) : isVideo ? (
                  <video src={selectedAttachment} controls className="max-w-full rounded-lg" />
                ) : (
                  <p className="text-muted-foreground">Unable to preview this file type</p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

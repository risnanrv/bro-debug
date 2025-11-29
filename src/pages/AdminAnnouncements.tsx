import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Bell, LogOut, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import brototypeLogo from '@/assets/brototype-logo-new.png';

export default function AdminAnnouncements() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoadingAnnouncements(false);
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rough idea first',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-announcement', {
        body: { roughIdea: aiInput }
      });

      if (error) throw error;

      setAiSuggestion(data);
      toast({
        title: 'AI Suggestions Ready',
        description: 'Review and apply below',
      });
    } catch (error: any) {
      toast({
        title: 'AI Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('announcements').insert({
      title,
      message,
      target: 'all',
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
      title: 'Success',
      description: 'Announcement created successfully',
    });

    setTitle('');
    setMessage('');
    setAiInput('');
    setAiSuggestion(null);
    setShowForm(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
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
      title: 'Success',
      description: 'Announcement deleted',
    });

    fetchAnnouncements();
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
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate('/admin')} className="hover:opacity-80 transition-opacity">
            <img src={brototypeLogo} alt="Brototype" className="logo-size pl-3 pt-1" />
          </button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/announcements')} className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Announcements</span>
            </Button>
            <Button variant="ghost" onClick={() => { supabase.auth.signOut(); navigate('/auth'); }} className="text-sm font-medium flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" onClick={() => navigate('/admin')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="border-b border-border bg-card/50 rounded-lg mb-6">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Manage Announcements</h1>
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 hover-lift">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">New Announcement</span>
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="font-semibold">AI Announcement Generator</Label>
                </div>
                <Textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Rough idea / notes for this announcement..." className="min-h-[80px]" />
                <Button onClick={handleAiGenerate} disabled={aiLoading} variant="outline" size="sm" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? 'Generating...' : 'Generate Announcement with AI'}
                </Button>
                {aiSuggestion && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm mt-1">{aiSuggestion.title}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setTitle(aiSuggestion.title)}>Apply</Button>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Message</Label>
                        <p className="text-sm mt-1">{aiSuggestion.message}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setMessage(aiSuggestion.message)}>Apply</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Announcement message" className="min-h-[120px]" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1">Create Announcement</Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setTitle(''); setMessage(''); setAiInput(''); setAiSuggestion(null); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnnouncements ? <p className="text-muted-foreground">Loading...</p> : announcements.length === 0 ? <p className="text-muted-foreground">No announcements yet</p> : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{announcement.title}</h3>
                          <p className="text-muted-foreground whitespace-pre-wrap mb-2">{announcement.message}</p>
                          <p className="text-xs text-muted-foreground">{new Date(announcement.created_at).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(announcement.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StudentUpdates() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      fetchReadStatus();
    }
  }, [user]);

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

  const fetchReadStatus = async () => {
    const { data, error } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('student_id', user?.id);

    if (!error && data) {
      setReadAnnouncements(new Set(data.map((r) => r.announcement_id)));
    }
  };

  const handleMarkAsRead = async (announcementId: string) => {
    const { error } = await supabase
      .from('announcement_reads')
      .insert({
        announcement_id: announcementId,
        student_id: user?.id,
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setReadAnnouncements(new Set([...readAnnouncements, announcementId]));
    toast({
      title: 'Marked as read',
      description: 'Announcement marked as read',
    });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const unreadCount = announcements.filter(
    (a) => !readAnnouncements.has(a.id)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Updates</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnnouncements ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : announcements.length === 0 ? (
              <p className="text-muted-foreground">No announcements yet</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => {
                  const isRead = readAnnouncements.has(announcement.id);
                  return (
                    <Card
                      key={announcement.id}
                      className={!isRead ? 'border-primary' : ''}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {announcement.title}
                              </h3>
                              {!isRead && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground whitespace-pre-wrap mb-2">
                              {announcement.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(announcement.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {!isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(announcement.id)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Mark as Read
                          </Button>
                        )}
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

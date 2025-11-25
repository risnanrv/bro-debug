import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bell } from 'lucide-react';

interface AnnouncementPreviewProps {
  userId: string;
}

const AnnouncementPreview = ({ userId }: AnnouncementPreviewProps) => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    const { data: announcementData } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: readData } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('student_id', userId);

    if (announcementData) {
      setAnnouncements(announcementData);
    }

    if (readData) {
      setReadAnnouncements(new Set(readData.map((r) => r.announcement_id)));
    }

    setLoading(false);
  };

  const unreadCount = announcements.filter((a) => !readAnnouncements.has(a.id)).length;

  return (
    <Card className="gradient-card border-border/50 shadow-xl h-fit sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Announcements
        </CardTitle>
        {unreadCount > 0 && (
          <Badge variant="default" className="bg-primary">
            {unreadCount} new
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const isRead = readAnnouncements.has(announcement.id);
              return (
                <div
                  key={announcement.id}
                  className="p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/updates')}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-semibold flex items-center gap-2 ${!isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {!isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                      {announcement.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {announcement.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/updates')}
              className="w-full gap-2 text-primary hover:text-primary"
            >
              View all updates
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementPreview;

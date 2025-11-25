import { CheckCircle2, Clock, MessageSquare, Pin, RotateCcw, AlertTriangle } from 'lucide-react';

export interface TimelineEvent {
  icon: 'pin' | 'clock' | 'message' | 'check' | 'reopen' | 'escalate';
  title: string;
  description?: string;
  timestamp: string;
  isActive: boolean;
}

interface ComplaintTimelineProps {
  events: TimelineEvent[];
}

const ComplaintTimeline = ({ events }: ComplaintTimelineProps) => {
  const getIcon = (iconType: string, isActive: boolean) => {
    const iconClass = `h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
    
    switch (iconType) {
      case 'pin':
        return <Pin className={iconClass} />;
      case 'clock':
        return <Clock className={iconClass} />;
      case 'message':
        return <MessageSquare className={iconClass} />;
      case 'check':
        return <CheckCircle2 className={iconClass} />;
      case 'reopen':
        return <RotateCcw className={iconClass} />;
      case 'escalate':
        return <AlertTriangle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                event.isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted border-border'
              }`}
            >
              {getIcon(event.icon, event.isActive)}
            </div>
            {index < events.length - 1 && (
              <div className={`w-0.5 h-full min-h-[40px] mt-2 ${event.isActive ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
          <div className="flex-1 pb-6">
            <h4 className={`font-semibold mb-1 ${event.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.title}
            </h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{event.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{event.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ComplaintTimeline;

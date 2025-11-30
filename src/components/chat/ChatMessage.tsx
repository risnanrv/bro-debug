import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessageProps {
  content: string;
  senderRole: 'student' | 'admin';
  timestamp: string;
  isOwnMessage: boolean;
  isRead?: boolean;
  isLastInGroup?: boolean;
}

export const ChatMessage = ({
  content,
  senderRole,
  timestamp,
  isOwnMessage,
  isRead,
  isLastInGroup,
}: ChatMessageProps) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
        <div className="flex items-center gap-1 px-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
          {isOwnMessage && isLastInGroup && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              {isRead ? (
                <>
                  <CheckCheck className="h-3 w-3" />
                  <span>Seen</span>
                </>
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

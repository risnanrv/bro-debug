import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { useComplaintChat } from "@/hooks/useComplaintChat";

interface ChatContainerProps {
  complaintId: string;
  currentUserId: string;
  currentUserRole: 'student' | 'admin';
  currentUserName: string;
}

export const ChatContainer = ({
  complaintId,
  currentUserId,
  currentUserRole,
  currentUserName,
}: ChatContainerProps) => {
  const { messages, isLoading, typingUser, sendMessage, handleTyping } = useComplaintChat({
    complaintId,
    currentUserId,
    currentUserRole,
    currentUserName,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  // Group messages by sender to determine last in group for read receipts
  const getLastMessageInGroup = (index: number) => {
    if (index === messages.length - 1) return true;
    return messages[index].sender_id !== messages[index + 1].sender_id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <Skeleton className="h-16 w-[70%]" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === currentUserId;
                const isLastInGroup = getLastMessageInGroup(index);
                const isRead = currentUserRole === 'student' 
                  ? message.read_by_admin 
                  : message.read_by_student;

                return (
                  <ChatMessage
                    key={message.id}
                    content={message.content}
                    senderRole={message.sender_role}
                    timestamp={message.created_at}
                    isOwnMessage={isOwnMessage}
                    isRead={isRead}
                    isLastInGroup={isLastInGroup}
                  />
                );
              })}
              {typingUser && (
                <TypingIndicator
                  userName={typingUser.name}
                  userRole={typingUser.role}
                />
              )}
            </div>
          )}
        </ScrollArea>
        <ChatInput
          onSend={sendMessage}
          onTyping={handleTyping}
          disabled={isLoading}
          placeholder="Type your message..."
        />
      </CardContent>
    </Card>
  );
};

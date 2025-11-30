import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_role: 'student' | 'admin';
  content: string;
  message_type: 'text' | 'system';
  created_at: string;
  read_by_student: boolean;
  read_by_admin: boolean;
}

interface TypingUser {
  userId: string;
  role: 'student' | 'admin';
  name: string;
}

interface UseComplaintChatProps {
  complaintId: string;
  currentUserId: string;
  currentUserRole: 'student' | 'admin';
  currentUserName: string;
}

export const useComplaintChat = ({
  complaintId,
  currentUserId,
  currentUserRole,
  currentUserName,
}: UseComplaintChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<TypingUser | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('complaint_messages')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
    } finally {
      setIsLoading(false);
    }
  }, [complaintId, toast]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    try {
      const updateField = currentUserRole === 'student' ? 'read_by_student' : 'read_by_admin';
      const senderRoleFilter = currentUserRole === 'student' ? 'admin' : 'student';

      await supabase
        .from('complaint_messages')
        .update({ [updateField]: true })
        .eq('complaint_id', complaintId)
        .eq('sender_role', senderRoleFilter)
        .eq(updateField, false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [complaintId, currentUserRole]);

  // Send a new message
  const sendMessage = useCallback(async (content: string) => {
    try {
      const { error } = await supabase
        .from('complaint_messages')
        .insert({
          complaint_id: complaintId,
          sender_id: currentUserId,
          sender_role: currentUserRole,
          content,
          message_type: 'text',
        });

      if (error) throw error;

      // Stop typing indicator when message is sent
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId, role: currentUserRole, isTyping: false, name: currentUserName },
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  }, [complaintId, currentUserId, currentUserRole, currentUserName, toast]);

  // Handle typing status
  const handleTyping = useCallback((isTyping: boolean) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, role: currentUserRole, isTyping, name: currentUserName },
      });
    }
  }, [currentUserId, currentUserRole, currentUserName]);

  // Setup realtime subscription
  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();

    const channel = supabase
      .channel(`complaint:${complaintId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaint_messages',
          filter: `complaint_id=eq.${complaintId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
          
          // Auto-mark as read if from other party
          if (newMessage.sender_id !== currentUserId) {
            setTimeout(() => markMessagesAsRead(), 500);
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Only show typing indicator for other users
        if (payload.userId !== currentUserId) {
          if (payload.isTyping) {
            setTypingUser({
              userId: payload.userId,
              role: payload.role,
              name: payload.name,
            });
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUser(null);
            }, 3000);
          } else {
            setTypingUser(null);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [complaintId, currentUserId, fetchMessages, markMessagesAsRead]);

  return {
    messages,
    isLoading,
    typingUser,
    sendMessage,
    handleTyping,
  };
};

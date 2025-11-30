interface TypingIndicatorProps {
  userName: string;
  userRole: 'student' | 'admin';
}

export const TypingIndicator = ({ userName, userRole }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">
        {userRole === 'admin' ? 'Admin' : userName} is typing...
      </span>
    </div>
  );
};

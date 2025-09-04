import { User, Bot, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import type { ChatMessage } from '@/types/chat';

interface MessageItemProps {
  message: ChatMessage;
  isLast?: boolean;
}

export default function MessageItem({ message }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[80%] space-y-1",
          isUser && "flex flex-col items-end"
        )}
      >
        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{isUser ? 'You' : 'Assistant'}</span>
          {message.timestamp && (
            <span>• {format(new Date(message.timestamp), 'HH:mm')}</span>
          )}
        </div>
        
        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-lg px-4 py-2 relative group",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted",
            message.error && "border border-destructive"
          )}
        >
          {/* Error indicator */}
          {message.error && (
            <div className="flex items-center gap-2 mb-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message.error}</span>
            </div>
          )}
          
          {/* Message text */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 pt-2 border-t space-y-1">
              {message.attachments.map((attachment, i) => (
                <div key={i} className="text-xs opacity-75">
                  📎 {attachment.name}
                </div>
              ))}
            </div>
          )}
          
          {/* Copy button for assistant messages */}
          {!isUser && (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "absolute -right-2 -top-2 h-6 w-6 p-0",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        
        {/* Loading indicator */}
        {message.isLoading && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
          </div>
        )}
      </div>
    </div>
  );
}
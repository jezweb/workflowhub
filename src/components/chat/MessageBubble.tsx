import { formatDistanceToNow } from 'date-fns';
import { Bot, Copy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, ChatAttachment } from '@/types/agent';
import { getFileTypeIcon, formatFileSize } from '@/types/agent';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: 'Copied',
        description: 'Message copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const renderAttachment = (attachment: ChatAttachment) => {
    const icon = getFileTypeIcon(attachment.type);
    
    return (
      <div
        key={attachment.id}
        className="flex items-center space-x-2 p-2 border rounded bg-muted/50"
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)}
          </p>
        </div>
        {attachment.url && (
          <Button size="sm" variant="ghost" asChild>
            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
        )}
      </div>
    );
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex space-x-3',
      isUser && 'flex-row-reverse space-x-reverse'
    )}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        'flex-1 space-y-2 max-w-[80%]',
        isUser && 'max-w-[70%]'
      )}>
        {/* Message Bubble */}
        <div
          className={cn(
            'relative group rounded-lg px-3 py-2 text-sm',
            isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted'
          )}
        >
          {/* Copy Button */}
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'absolute -top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
              isUser 
                ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" />
          </Button>

          {/* Message Text */}
          <div className="whitespace-pre-wrap break-words pr-6">
            {message.content}
          </div>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn(
            'space-y-2',
            isUser && 'ml-auto'
          )}>
            {message.attachments.map(renderAttachment)}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          'text-xs text-muted-foreground',
          isUser && 'text-right'
        )}>
          {formatTimestamp(message.created_at)}
        </div>
      </div>
    </div>
  );
}
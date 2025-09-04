import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import MessageItem from './MessageItem';
import useChatStore from '@/stores/chatStore';

interface ChatMessagesProps {
  conversationId: string;
}

export default function ChatMessages({ conversationId }: ChatMessagesProps) {
  const { messages, loadingMessages, fetchMessages } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const conversationMessages = messages.get(conversationId) || [];
  
  // Fetch messages when conversation changes
  useEffect(() => {
    if (!messages.has(conversationId)) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages]);
  
  if (loadingMessages && conversationMessages.length === 0) {
    return (
      <div className="h-full p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full max-w-md" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          conversationMessages.map((message, index) => (
            <MessageItem 
              key={index} 
              message={message}
              isLast={index === conversationMessages.length - 1}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
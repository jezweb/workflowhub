import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types/chat';
import useChatStore from '@/stores/chatStore';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation
}: ConversationListProps) {
  const { deleteConversation } = useChatStore();
  
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
    }
  };
  
  // Sort conversations by last message or creation date
  const sortedConversations = [...conversations].sort((a, b) => {
    const aDate = a.last_message_at || a.created_at;
    const bDate = b.last_message_at || b.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
  
  return (
    <ScrollArea className="flex-1 px-2">
      <div className="space-y-1">
        {sortedConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              activeConversationId === conversation.id && "bg-accent text-accent-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {conversation.title || 'Untitled'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {conversation.last_message_at ? (
                  <span>
                    {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                  </span>
                ) : (
                  <span>No messages</span>
                )}
                {conversation.message_count > 0 && (
                  <span>• {conversation.message_count} messages</span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleDelete(e, conversation.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-4">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No conversations yet
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
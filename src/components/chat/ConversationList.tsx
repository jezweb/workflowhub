import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bot, Globe, Lock, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/agent';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  onDelete 
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await onDelete(conversationId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatLastMessage = (lastMessageAt: string | undefined) => {
    if (!lastMessageAt) return 'No messages';
    
    try {
      return formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              'relative group flex items-start space-x-3 rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors',
              selectedId === conversation.id && 'bg-accent'
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <div className="flex-shrink-0">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium truncate">
                  {conversation.title || `Chat with ${(conversation as any).agent_name || 'Agent'}`}
                </h4>
                
                <div className="flex items-center space-x-1">
                  {(conversation as any).agent_is_public ? (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-2 w-2 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-2 w-2 mr-1" />
                      Private
                    </Badge>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => handleDelete(conversation.id, e)}
                        disabled={deletingId === conversation.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === conversation.id ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">
                  {(conversation as any).agent_name || 'Unknown Agent'}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {conversation.message_count > 0 && (
                    <span>{conversation.message_count} messages</span>
                  )}
                  <span>{formatLastMessage(conversation.last_message_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
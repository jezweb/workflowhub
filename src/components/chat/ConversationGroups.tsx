import { Folder, Edit2, Trash2, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ConversationGroup } from '@/types/chat';
import useChatStore from '@/stores/chatStore';

interface ConversationGroupsProps {
  groups: ConversationGroup[];
  activeGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onEditGroup: (group: ConversationGroup) => void;
}

export default function ConversationGroups({
  groups,
  activeGroupId,
  onSelectGroup,
  onEditGroup
}: ConversationGroupsProps) {
  const { deleteGroup } = useChatStore();
  
  const handleDeleteGroup = async (e: React.MouseEvent, group: ConversationGroup) => {
    e.stopPropagation();
    if (confirm(`Delete group "${group.name}"? Conversations will be kept but ungrouped.`)) {
      await deleteGroup(group.id);
    }
  };
  
  // Sort groups: pinned first, then by position
  const sortedGroups = [...groups].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return a.position - b.position;
  });
  
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1">
        {/* All Conversations */}
        <button
          onClick={() => onSelectGroup(null)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            activeGroupId === null && "bg-accent text-accent-foreground"
          )}
        >
          <Folder className="h-4 w-4" />
          <span className="flex-1 text-left">All Conversations</span>
        </button>
        
        {/* Groups */}
        {sortedGroups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              activeGroupId === group.id && "bg-accent text-accent-foreground"
            )}
          >
            <button
              onClick={() => onSelectGroup(group.id)}
              className="flex-1 flex items-center gap-2 text-left"
            >
              {group.is_pinned && <Pin className="h-3 w-3" />}
              <span 
                className="flex-shrink-0"
                style={{ color: group.color }}
              >
                {group.icon || '📁'}
              </span>
              <span className="flex-1 truncate">{group.name}</span>
              {group.conversation_count ? (
                <span className="text-xs text-muted-foreground">
                  {group.conversation_count}
                </span>
              ) : null}
            </button>
            
            {/* Group Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(group);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => handleDeleteGroup(e, group)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No groups yet
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
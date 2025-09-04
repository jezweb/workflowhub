import { useEffect, useState } from 'react';
import { Plus, MessageSquare, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ConversationGroups from './ConversationGroups';
import ConversationList from './ConversationList';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import GroupEditor from './GroupEditor';
import useChatStore from '@/stores/chatStore';
import api from '@/lib/api';

export default function ChatContainer() {
  const {
    groups,
    conversations,
    agents,
    activeGroupId,
    activeConversationId,
    fetchGroups,
    fetchConversations,
    setAgents,
    setActiveGroup,
    setActiveConversation,
    createConversation
  } = useChatStore();
  
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  
  // Fetch initial data
  useEffect(() => {
    fetchGroups();
    fetchConversations();
    
    // Fetch agents
    api.get('/agents').then(response => {
      if (response.success) {
        setAgents(response.agents);
      }
    });
  }, []);
  
  // Get active conversation and agent
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeGroup = groups.find(g => g.id === activeGroupId);
  const activeAgent = activeConversation 
    ? agents.find(a => a.id === activeConversation.agent_id) 
    : null;
  
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupEditor(true);
  };
  
  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    setShowGroupEditor(true);
  };
  
  const handleCreateConversation = async () => {
    if (!activeGroupId && agents.length === 0) {
      // Need at least one agent
      return;
    }
    
    setCreatingConversation(true);
    try {
      const conversation = await createConversation({
        group_id: activeGroupId,
        agent_id: activeGroup?.agent_id || agents[0]?.id,
        title: 'New Conversation'
      });
      setActiveConversation(conversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setCreatingConversation(false);
    }
  };
  
  // No agents available
  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Agents Available</h3>
          <p className="text-muted-foreground mb-4">
            You need to create an agent before you can start chatting.
          </p>
          <Button onClick={() => window.location.href = '/agents'}>
            Go to Agents
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col border-r">
            {/* Groups Section */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Groups</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCreateGroup}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ConversationGroups
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={setActiveGroup}
                onEditGroup={handleEditGroup}
              />
            </div>
            
            {/* Conversations Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {activeGroup ? activeGroup.name : 'All Conversations'}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCreateConversation}
                    disabled={creatingConversation}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ConversationList
                conversations={conversations.filter(c => 
                  activeGroupId ? c.group_id === activeGroupId : true
                )}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversation}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Chat Area */}
        <ResizablePanel defaultSize={80}>
          <div className="h-full flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-medium">{activeConversation.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {activeAgent?.name || 'Agent'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                  <ChatMessages conversationId={activeConversation.id} />
                </div>
                
                {/* Input */}
                <div className="border-t p-4">
                  <ChatInput conversationId={activeConversation.id} />
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                  <p className="text-muted-foreground mb-6">
                    Start by creating a group to organize your conversations, or jump right into a new chat
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleCreateGroup}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create Group
                    </Button>
                    <Button 
                      onClick={handleCreateConversation} 
                      disabled={creatingConversation}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Conversation
                    </Button>
                  </div>
                  {groups.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-4">
                      <span className="font-medium">Tip:</span> Groups help you organize conversations with consistent context and settings
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Group Editor Modal */}
      {showGroupEditor && (
        <GroupEditor
          group={editingGroup}
          agents={agents}
          onClose={() => {
            setShowGroupEditor(false);
            setEditingGroup(null);
          }}
          onSave={() => {
            setShowGroupEditor(false);
            setEditingGroup(null);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}
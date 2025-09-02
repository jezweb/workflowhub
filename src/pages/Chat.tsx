import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Conversation, Agent } from '@/types/agent';
import ConversationList from '@/components/chat/ConversationList';
import ChatInterface from '@/components/chat/ChatInterface';
import NewConversationDialog from '@/components/chat/NewConversationDialog';

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [conversationsResponse, agentsResponse] = await Promise.all([
        api.get('/conversations'),
        api.get('/agents')
      ]);

      const conversationsData: any = await conversationsResponse.json();
      const agentsData: any = await agentsResponse.json();

      if (conversationsData.success) {
        setConversations(conversationsData.conversations || []);
      }

      if (agentsData.success) {
        setAgents(agentsData.agents || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load chat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    if (agents.length === 0) {
      toast({
        title: 'No Agents Available',
        description: 'You need to create at least one agent before starting a conversation.',
        variant: 'destructive',
      });
      return;
    }
    setIsNewDialogOpen(true);
  };

  const handleConversationCreated = async (conversation: Conversation) => {
    await fetchData(); // Refresh conversations
    setSelectedConversationId(conversation.id);
    setIsNewDialogOpen(false);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleConversationDelete = async (conversationId: string) => {
    try {
      await api.delete(`/conversations/${conversationId}`);
      toast({
        title: 'Success',
        description: 'Conversation deleted successfully',
      });
      
      // If deleted conversation was selected, clear selection
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      
      await fetchData(); // Refresh conversations
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button size="sm" onClick={handleNewConversation}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Start a conversation with one of your AI agents
                  </p>
                  <Button onClick={handleNewConversation}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={handleConversationSelect}
              onDelete={handleConversationDelete}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ChatInterface
            conversationId={selectedConversationId}
            onConversationUpdate={fetchData}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-96">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">Welcome to Chat</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Select a conversation from the sidebar or start a new one to begin chatting with your AI agents.
                </p>
                <Button onClick={handleNewConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        agents={agents}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
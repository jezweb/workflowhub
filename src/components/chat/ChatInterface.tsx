import { useState, useEffect, useRef } from 'react';
import { Bot, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Conversation, ChatMessage } from '@/types/agent';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
  conversationId: string;
  onConversationUpdate: () => void;
}

export default function ChatInterface({ conversationId, onConversationUpdate }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      const data: any = await response.json();
      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.messages || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load conversation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    if (!content.trim()) return;

    setSending(true);
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        content: content.trim(),
        attachments: attachments || [],
      });

      if (response.data.success) {
        // Add both user and assistant messages
        const newMessages: ChatMessage[] = [];
        if (response.data.user_message) {
          newMessages.push(response.data.user_message);
        }
        if (response.data.assistant_message) {
          newMessages.push(response.data.assistant_message);
        }
        
        setMessages(prev => [...prev, ...newMessages]);
        onConversationUpdate(); // Update conversation list
        
        // Show latency info if available
        if (response.data.latency) {
          toast({
            title: 'Message sent',
            description: `Response received in ${response.data.latency}ms`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to send message',
          variant: 'destructive',
        });
        
        // If user message was saved but AI failed, still add user message
        if (response.data.user_message) {
          setMessages(prev => [...prev, response.data.user_message]);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Conversation not found</div>
      </div>
    );
  }

  const agentName = (conversation as any).agent_name || 'AI Assistant';
  const agentDescription = (conversation as any).agent_description;
  const isPublicAgent = (conversation as any).agent_is_public;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6 text-muted-foreground" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{conversation.title || `Chat with ${agentName}`}</h3>
                <Badge variant={isPublicAgent ? 'secondary' : 'outline'}>
                  {isPublicAgent ? 'Public' : 'Private'}
                </Badge>
              </div>
              {agentDescription && (
                <p className="text-sm text-muted-foreground mt-1">{agentDescription}</p>
              )}
              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                <span>Agent: {agentName}</span>
                <Separator orientation="vertical" className="h-3" />
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">Start the conversation</h4>
                <p className="text-muted-foreground">
                  Send a message to {agentName} to begin your conversation.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <MessageInput
            onSend={handleSendMessage}
            disabled={sending}
            placeholder={`Message ${agentName}...`}
          />
        </div>
      </div>
    </div>
  );
}
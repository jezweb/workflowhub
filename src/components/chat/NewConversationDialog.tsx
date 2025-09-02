import { useState } from 'react';
import { Bot, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Agent, Conversation, CreateConversationRequest } from '@/types/agent';

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  agents: Agent[];
  onConversationCreated: (conversation: Conversation) => void;
}

export default function NewConversationDialog({
  open,
  onClose,
  agents,
  onConversationCreated,
}: NewConversationDialogProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [title, setTitle] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent) {
      toast({
        title: 'No agent selected',
        description: 'Please select an agent to chat with',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const request: CreateConversationRequest = {
        agent_id: selectedAgent.id,
        title: title.trim() || undefined,
        initial_message: initialMessage.trim() || undefined,
      };

      const response = await api.post('/conversations', request);
      
      if (response.data.success) {
        onConversationCreated(response.data.conversation);
        
        // Reset form
        setSelectedAgent(null);
        setTitle('');
        setInitialMessage('');
        
        toast({
          title: 'Success',
          description: 'Conversation created successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: response.data.error || 'Failed to create conversation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedAgent(null);
      setTitle('');
      setInitialMessage('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>
            Choose an AI agent and optionally provide an initial message to start your conversation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Agent</Label>
            <ScrollArea className="max-h-60">
              <div className="grid gap-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      'flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      selectedAgent?.id === agent.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <Bot className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{agent.name}</h4>
                        <Badge variant={agent.is_public ? 'secondary' : 'outline'}>
                          {agent.is_public ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                        {!agent.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      {agent.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {agent.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Model: {agent.model}</span>
                        <span>Temperature: {agent.temperature}</span>
                        <span>Max tokens: {agent.max_tokens}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Conversation Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Conversation Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedAgent 
                  ? `Chat with ${selectedAgent.name}`
                  : "Enter conversation title..."
              }
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default title
            </p>
          </div>

          {/* Initial Message */}
          <div className="space-y-2">
            <Label htmlFor="initialMessage">Initial Message (Optional)</Label>
            <Textarea
              id="initialMessage"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Enter your first message to start the conversation..."
              rows={3}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground">
              You can start chatting immediately or leave this empty
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedAgent || loading}
            >
              {loading ? 'Creating...' : 'Start Conversation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
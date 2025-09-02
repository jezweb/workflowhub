import { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Agent, TestAgentRequest, TestAgentResponse } from '@/types/agent';

interface AgentTesterProps {
  agent: Agent;
  onClose: () => void;
}

export default function AgentTester({ agent, onClose }: AgentTesterProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<TestAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a test message',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const testRequest: TestAgentRequest = {
        message: message.trim(),
      };

      const data = await api.post(
        `/api/agents/${agent.id}/test`,
        testRequest
      ) as TestAgentResponse;

      setResponse(data);

      if (!data.success) {
        toast({
          title: 'Test Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to test agent';
      setResponse({
        success: false,
        error: errorMessage,
      });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Test Agent: {agent.name}</DialogTitle>
          <DialogDescription>
            Send a test message to your agent's webhook to verify it's working correctly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Webhook URL</div>
            <code className="text-xs bg-muted p-2 rounded block break-all">
              {agent.webhook_url}
            </code>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Test Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a test message..."
              rows={3}
              disabled={loading}
            />
          </div>

          <Button onClick={handleTest} disabled={loading || !message.trim()} className="w-full">
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Message
              </>
            )}
          </Button>

          {response && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={response.success ? 'default' : 'destructive'}>
                      {response.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>

                  {response.latency && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-sm text-muted-foreground">
                        {response.latency}ms
                      </span>
                    </div>
                  )}

                  {response.response && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Response</span>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                        {response.response}
                      </div>
                    </div>
                  )}

                  {response.error && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-destructive">Error</span>
                      <div className="bg-destructive/10 text-destructive p-3 rounded text-sm whitespace-pre-wrap break-words">
                        {response.error}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
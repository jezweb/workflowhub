import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Plus } from 'lucide-react';

export function ChatPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <p className="mt-1 text-sm text-gray-600">
            AI-powered conversations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No conversations yet</CardTitle>
          <CardDescription>
            Start a new conversation to interact with AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
import ChatContainer from '@/components/chat/ChatContainer';

export function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="mt-1 text-sm text-gray-600">
          AI-powered conversations with your agents
        </p>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1 p-6 pt-4">
        <div className="h-full bg-background rounded-lg border">
          <ChatContainer />
        </div>
      </div>
    </div>
  );
}
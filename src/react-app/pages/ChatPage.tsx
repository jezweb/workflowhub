import { useState, useEffect } from 'react';
import { Send, FolderPlus, MessageSquare } from 'lucide-react';

interface ChatFolder {
  id: string;
  name: string;
  icon?: string;
  webhook_url: string;
}

interface ChatThread {
  id: string;
  folder_id: string;
  title: string;
  last_message?: string;
  last_activity: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      fetchThreads(selectedFolder);
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
    }
  }, [selectedThread]);

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/chat/folders');
      const data = await response.json();
      setFolders(data);
      if (data.length > 0 && !selectedFolder) {
        setSelectedFolder(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchThreads = async (folderId: string) => {
    try {
      const response = await fetch(`/api/chat/folders/${folderId}/threads`);
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/chat/threads/${threadId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chat/threads/${selectedThread}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await response.json();
      
      setMessages([...messages, data.userMessage, data.assistantMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Folders sidebar */}
      <div className="w-48 bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Folders</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <FolderPlus size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                selectedFolder === folder.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">{folder.icon || '📁'}</span>
              {folder.name}
            </button>
          ))}
        </div>
      </div>

      {/* Threads list */}
      <div className="w-64 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Conversations</h3>
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`w-full text-left px-3 py-2 rounded-md ${
                selectedThread === thread.id
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{thread.title}</div>
              {thread.last_message && (
                <div className="text-xs text-gray-500 truncate mt-1">
                  {thread.last_message}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col">
        {selectedThread ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
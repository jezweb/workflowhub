import { create } from 'zustand';
import type { 
  ConversationGroup, 
  Conversation, 
  ChatMessage 
} from '@/types/chat';
import type { Agent } from '@/types/agent';
import { chatApi } from '@/lib/api';

interface ChatStore {
  // State
  groups: ConversationGroup[];
  conversations: Conversation[];
  agents: Agent[];
  activeGroupId: string | null;
  activeConversationId: string | null;
  messages: Map<string, ChatMessage[]>;
  loadingMessages: boolean;
  sendingMessage: boolean;
  
  // Actions - Groups
  fetchGroups: () => Promise<void>;
  createGroup: (data: any) => Promise<ConversationGroup>;
  updateGroup: (id: string, data: any) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  setActiveGroup: (id: string | null) => void;
  
  // Actions - Conversations
  fetchConversations: (groupId?: string) => Promise<void>;
  createConversation: (data: any) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  
  // Actions - Messages
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, message: string, attachments?: any[]) => Promise<void>;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  clearMessages: (conversationId: string) => void;
  
  // Actions - Agents
  setAgents: (agents: Agent[]) => void;
}

const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  groups: [],
  conversations: [],
  agents: [],
  activeGroupId: null,
  activeConversationId: null,
  messages: new Map(),
  loadingMessages: false,
  sendingMessage: false,
  
  // Group actions
  fetchGroups: async () => {
    try {
      const response = await chatApi.listGroups();
      if (response.success) {
        set({ groups: response.groups });
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  },
  
  createGroup: async (data) => {
    const response = await chatApi.createGroup(data);
    if (response.success) {
      const { groups } = get();
      set({ groups: [...groups, response.group] });
      return response.group;
    }
    throw new Error(response.error || 'Failed to create group');
  },
  
  updateGroup: async (id, data) => {
    const response = await chatApi.updateGroup(id, data);
    if (response.success) {
      const { groups } = get();
      set({
        groups: groups.map(g => g.id === id ? response.group : g)
      });
    }
  },
  
  deleteGroup: async (id) => {
    const response = await chatApi.deleteGroup(id);
    if (response.success) {
      const { groups, activeGroupId } = get();
      set({
        groups: groups.filter(g => g.id !== id),
        activeGroupId: activeGroupId === id ? null : activeGroupId
      });
    }
  },
  
  setActiveGroup: (id) => {
    set({ activeGroupId: id });
    if (id) {
      // Fetch conversations for this group
      get().fetchConversations(id);
    }
  },
  
  // Conversation actions
  fetchConversations: async (groupId?: string) => {
    try {
      const response = await chatApi.listConversations(groupId);
      if (response.success) {
        set({ conversations: response.conversations });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  },
  
  createConversation: async (data) => {
    const response = await chatApi.createConversation(data);
    if (response.success) {
      const { conversations } = get();
      set({ conversations: [...conversations, response.conversation] });
      return response.conversation;
    }
    throw new Error(response.error || 'Failed to create conversation');
  },
  
  deleteConversation: async (id) => {
    const response = await chatApi.deleteConversation(id);
    if (response.success) {
      const { conversations, activeConversationId, messages } = get();
      const newMessages = new Map(messages);
      newMessages.delete(id);
      
      set({
        conversations: conversations.filter(c => c.id !== id),
        activeConversationId: activeConversationId === id ? null : activeConversationId,
        messages: newMessages
      });
    }
  },
  
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      // Fetch messages if not already loaded
      const { messages } = get();
      if (!messages.has(id)) {
        get().fetchMessages(id);
      }
    }
  },
  
  // Message actions
  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    try {
      const response = await chatApi.getMessages(conversationId);
      if (response.success) {
        const { messages } = get();
        const newMessages = new Map(messages);
        newMessages.set(conversationId, response.messages);
        set({ messages: newMessages });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ loadingMessages: false });
    }
  },
  
  sendMessage: async (conversationId, message, attachments) => {
    set({ sendingMessage: true });
    
    // Add user message optimistically
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      attachments
    };
    get().addMessage(conversationId, userMessage);
    
    try {
      const response = await chatApi.sendMessage(conversationId, {
        message,
        attachments
      });
      
      if (response.success) {
        // Add assistant response
        get().addMessage(conversationId, response.message);
        
        // Update conversation metadata
        const { conversations } = get();
        set({
          conversations: conversations.map(c => 
            c.id === conversationId 
              ? { ...c, last_message_at: response.message.timestamp, message_count: c.message_count + 2 }
              : c
          )
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      get().addMessage(conversationId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message.',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      set({ sendingMessage: false });
    }
  },
  
  addMessage: (conversationId, message) => {
    const { messages } = get();
    const newMessages = new Map(messages);
    const conversationMessages = newMessages.get(conversationId) || [];
    newMessages.set(conversationId, [...conversationMessages, message]);
    set({ messages: newMessages });
  },
  
  clearMessages: (conversationId) => {
    const { messages } = get();
    const newMessages = new Map(messages);
    newMessages.delete(conversationId);
    set({ messages: newMessages });
  },
  
  // Agent actions
  setAgents: (agents) => {
    set({ agents });
  },
}));

export default useChatStore;
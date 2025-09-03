import { create } from 'zustand';
import type { ActionExecution, ExecutionListParams } from '@/types/execution';

interface NotificationState {
  executions: ActionExecution[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  currentPage: number;
  totalPages: number;
  filter: ExecutionListParams;
  
  // Actions
  fetchExecutions: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (executionId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteExecution: (executionId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setFilter: (filter: Partial<ExecutionListParams>) => void;
  setPage: (page: number) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

const API_BASE = '/api/executions';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  executions: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  isOpen: false,
  currentPage: 1,
  totalPages: 1,
  filter: { limit: 20 },
  
  fetchExecutions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filter, currentPage } = get();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: (filter.limit || 20).toString(),
        ...(filter.status && { status: filter.status }),
        ...(filter.action_id && { action_id: filter.action_id }),
        ...(filter.unread_only && { unread_only: 'true' }),
      });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch executions');
      
      const data = await response.json() as any;
      set({
        executions: data.executions,
        unreadCount: data.unread_count,
        totalPages: Math.ceil(data.total / data.limit),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchUnreadCount: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch unread count');
      
      const data = await response.json() as any;
      set({ unreadCount: data.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },
  
  markAsRead: async (executionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${executionId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      
      // Update local state
      set(state => ({
        executions: state.executions.map(exec =>
          exec.id === executionId ? { ...exec, is_read: true } : exec
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },
  
  markAllAsRead: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to mark all as read');
      
      // Update local state
      set(state => ({
        executions: state.executions.map(exec => ({ ...exec, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },
  
  deleteExecution: async (executionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/${executionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete execution');
      
      // Update local state
      set(state => {
        const execution = state.executions.find(e => e.id === executionId);
        const wasUnread = execution && !execution.is_read;
        
        return {
          executions: state.executions.filter(exec => exec.id !== executionId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete execution:', error);
    }
  },
  
  clearAll: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_BASE, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to clear executions');
      
      set({ executions: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear executions:', error);
    }
  },
  
  setFilter: (filter: Partial<ExecutionListParams>) => {
    set(state => ({
      filter: { ...state.filter, ...filter },
      currentPage: 1, // Reset to first page when filter changes
    }));
    get().fetchExecutions();
  },
  
  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchExecutions();
  },
  
  togglePanel: () => set(state => ({ isOpen: !state.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
}));

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = () => {
  if (refreshInterval) return;
  
  refreshInterval = setInterval(() => {
    const store = useNotificationStore.getState();
    if (store.isOpen) {
      store.fetchExecutions();
    } else {
      store.fetchUnreadCount();
    }
  }, 30000); // 30 seconds
};

export const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval as any);
    refreshInterval = null;
  }
};
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8787/api' 
  : '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  const data = await response.json() as any;
  
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'Request failed');
  }
  
  return data as T;
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  
  register: (username: string, email: string, password: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  
  verify: () => apiRequest('/auth/verify'),
};

// Forms API
export const formsApi = {
  list: () => apiRequest('/forms'),
  
  get: (id: string) => apiRequest(`/forms/${id}`),
  
  create: (form: any) =>
    apiRequest('/forms', {
      method: 'POST',
      body: JSON.stringify(form),
    }),
  
  update: (id: string, form: any) =>
    apiRequest(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    }),
  
  delete: (id: string) =>
    apiRequest(`/forms/${id}`, {
      method: 'DELETE',
    }),
  
  submit: (id: string, data: any) =>
    apiRequest(`/forms/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
  
  getSubmissions: (id: string) => apiRequest(`/forms/${id}/submissions`),
  
  clone: (id: string) =>
    apiRequest(`/forms/${id}/clone`, {
      method: 'POST',
    }),
  
  export: (id: string) => apiRequest(`/forms/${id}/export`),
  
  import: (data: any) =>
    apiRequest('/forms/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export convenience functions
export const getForms = formsApi.list;
export const getForm = formsApi.get;
export const createForm = formsApi.create;
export const updateForm = formsApi.update;
export const deleteForm = formsApi.delete;
export const submitForm = formsApi.submit;

// Actions API
export const actionsApi = {
  list: () => apiRequest('/actions'),
  
  get: (id: string) => apiRequest(`/actions/${id}`),
  
  create: (action: any) =>
    apiRequest('/actions', {
      method: 'POST',
      body: JSON.stringify(action),
    }),
  
  update: (id: string, action: any) =>
    apiRequest(`/actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(action),
    }),
  
  execute: (id: string) =>
    apiRequest(`/actions/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
    
  test: (id: string) =>
    apiRequest(`/actions/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  
  delete: (id: string) =>
    apiRequest(`/actions/${id}`, {
      method: 'DELETE',
    }),
};

// Chat API
export const chatApi = {
  // Groups
  listGroups: () => apiRequest('/chat/groups'),
  
  createGroup: (data: any) =>
    apiRequest('/chat/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateGroup: (id: string, data: any) =>
    apiRequest(`/chat/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteGroup: (id: string) =>
    apiRequest(`/chat/groups/${id}`, {
      method: 'DELETE',
    }),
  
  // Conversations
  listConversations: (groupId?: string) => {
    const query = groupId ? `?group_id=${groupId}` : '';
    return apiRequest(`/chat/conversations${query}`);
  },
  
  createConversation: (data: any) =>
    apiRequest('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  deleteConversation: (id: string) =>
    apiRequest(`/chat/conversations/${id}`, {
      method: 'DELETE',
    }),
  
  // Messages
  getMessages: (conversationId: string) =>
    apiRequest(`/chat/conversations/${conversationId}/messages`),
  
  sendMessage: (conversationId: string, data: any) =>
    apiRequest(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Database API
export const databaseApi = {
  listTables: () => apiRequest('/database/tables'),
  
  getTableSchema: (tableName: string) =>
    apiRequest(`/database/tables/${tableName}/schema`),
  
  getTableData: (tableName: string, params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params?.search) query.append('search', params.search);
    
    return apiRequest(`/database/tables/${tableName}/data?${query.toString()}`);
  },
  
  exportTable: (tableName: string, format: 'json' | 'csv', allData = false) => {
    const query = new URLSearchParams({
      format,
      all: allData.toString()
    });
    
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/database/tables/${tableName}/export?${query.toString()}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },
  
  executeQuery: (query: string) =>
    apiRequest('/database/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
};

// Files API
export const filesApi = {
  list: () => apiRequest('/files'),
  
  upload: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file-${index}`, file);
    });
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json() as any;
    if (!response.ok) {
      throw new ApiError(response.status, data.error || 'Upload failed');
    }
    
    return data;
  },
  
  delete: (id: string) =>
    apiRequest(`/files/${id}`, {
      method: 'DELETE',
    }),
};

// Settings API
export const settingsApi = {
  get: () => apiRequest('/settings'),
  
  update: (key: string, value: any) =>
    apiRequest(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  
  delete: (key: string) =>
    apiRequest(`/settings/${key}`, {
      method: 'DELETE',
    }),
};

// Executions API
export const executionsApi = {
  list: (params?: any) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/executions${queryString}`);
  },
  
  get: (id: string) => apiRequest(`/executions/${id}`),
  
  getUnreadCount: () => apiRequest('/executions/unread/count'),
  
  markAsRead: (id: string) =>
    apiRequest(`/executions/${id}/read`, {
      method: 'PATCH',
    }),
  
  markAllAsRead: () =>
    apiRequest('/executions/mark-all-read', {
      method: 'POST',
    }),
  
  delete: (id: string) =>
    apiRequest(`/executions/${id}`, {
      method: 'DELETE',
    }),
  
  clearAll: (status?: string) => {
    const queryString = status ? `?status=${status}` : '';
    return apiRequest(`/executions${queryString}`, {
      method: 'DELETE',
    });
  },
};

// Storage API
export const storageApi = {
  listBuckets: () => apiRequest('/storage/buckets'),
  
  getBucket: (id: string) => apiRequest(`/storage/buckets/${id}`),
  
  createBucket: (data: {
    name: string;
    description?: string;
    provider: 'r2' | 's3';
    is_default?: boolean;
    is_default_chat?: boolean;
    is_default_forms?: boolean;
    config: any;
  }) => apiRequest('/storage/buckets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateBucket: (id: string, data: any) => apiRequest(`/storage/buckets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteBucket: (id: string) => apiRequest(`/storage/buckets/${id}`, {
    method: 'DELETE',
  }),
  
  testConnection: (id: string) => apiRequest(`/storage/buckets/${id}/test`, {
    method: 'POST',
  }),
  
  getDefaults: () => apiRequest('/storage/defaults'),
};

// Convenience default export with all APIs
const api = {
  get: (url: string) => apiRequest(url),
  post: (url: string, data?: any) => apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: (url: string, data?: any) => apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (url: string) => apiRequest(url, {
    method: 'DELETE',
  }),
};

export default api;
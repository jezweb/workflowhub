import type { 
  OrganizationContext, 
  TeamProfile, 
  CustomVariable, 
  AvailableVariables 
} from '@/types/context';

const API_BASE = '/api/context';

// Organization API
export const organizationApi = {
  get: async (): Promise<OrganizationContext | null> => {
    const response = await fetch(`${API_BASE}/organization`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch organization');
    const data = await response.json() as { organization: OrganizationContext | null };
    return data.organization;
  },

  update: async (org: OrganizationContext): Promise<void> => {
    const response = await fetch(`${API_BASE}/organization`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(org)
    });
    if (!response.ok) throw new Error('Failed to update organization');
  }
};

// Team Profiles API
export const teamApi = {
  list: async (): Promise<TeamProfile[]> => {
    const response = await fetch(`${API_BASE}/team`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch team profiles');
    const data = await response.json() as { profiles: TeamProfile[] };
    return data.profiles;
  },

  getMe: async (): Promise<TeamProfile | null> => {
    const response = await fetch(`${API_BASE}/team/me`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    const data = await response.json() as { profile: TeamProfile | null };
    return data.profile;
  },

  updateMe: async (profile: Partial<TeamProfile>): Promise<void> => {
    const response = await fetch(`${API_BASE}/team/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profile)
    });
    if (!response.ok) throw new Error('Failed to update profile');
  }
};

// Custom Variables API
export const variablesApi = {
  list: async (category?: 'global' | 'user'): Promise<CustomVariable[]> => {
    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${API_BASE}/variables${params}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch variables');
    const data = await response.json() as { variables: CustomVariable[] };
    return data.variables;
  },

  create: async (variable: Omit<CustomVariable, 'id'>): Promise<void> => {
    const response = await fetch(`${API_BASE}/variables`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(variable)
    });
    if (!response.ok) throw new Error('Failed to create variable');
  },

  update: async (variable: CustomVariable): Promise<void> => {
    const response = await fetch(`${API_BASE}/variables`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(variable)
    });
    if (!response.ok) throw new Error('Failed to update variable');
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/variables/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to delete variable');
  },

  getAvailable: async (): Promise<AvailableVariables> => {
    const response = await fetch(`${API_BASE}/variables/available`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch available variables');
    return response.json();
  }
};

// Get available variables for Actions
export const getActionVariables = async (): Promise<AvailableVariables> => {
  const response = await fetch('/api/actions/variables', {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch action variables');
  return response.json();
};
export interface OrganizationContext {
  id?: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  social_links?: Record<string, string>;
  context_text?: string;
  keywords?: string[];
  products?: string[];
  services?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface TeamProfile {
  id?: string;
  user_id: string;
  username?: string;
  user_email?: string;
  full_name?: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  photo_url?: string;
  bio?: string;
  skills?: string[];
  custom_fields?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomVariable {
  id?: string;
  category: 'global' | 'user' | 'organization';
  key: string;
  value: string;
  description?: string;
  data_type?: 'string' | 'number' | 'boolean' | 'json';
  is_sensitive?: boolean;
  user_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  display_value?: string; // Masked value for sensitive variables
}

export interface VariableGroup {
  user: Record<string, string>;
  organization: Record<string, string>;
  team: Record<string, string>;
  custom: Record<string, string>;
  my: Record<string, string>;
  time: Record<string, string>;
  system: Record<string, string>;
}

export interface AvailableVariables {
  variables: Record<string, string>;
  grouped: VariableGroup;
  total: number;
}
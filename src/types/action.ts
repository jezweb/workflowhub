export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ResponseType = 'modal' | 'page' | 'toast';
export type ButtonStyle = 'solid' | 'gradient';
export type OnSuccessAction = 'silent' | 'toast' | 'modal' | 'navigate' | 'refresh';
export type ColorTheme = 'ocean' | 'forest' | 'sunset' | 'berry' | 'rose' | 'slate' | 'emerald' | 'amber' | 'indigo' | 'custom';

export interface Action {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  payload: Record<string, any>;
  response_type: ResponseType;
  icon: string;
  color_theme: ColorTheme;
  button_style: ButtonStyle;
  on_success: OnSuccessAction;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActionFormData {
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  payload: Record<string, any>;
  response_type: ResponseType;
  icon?: string;
  color_theme?: ColorTheme;
  button_style?: ButtonStyle;
  on_success?: OnSuccessAction;
}

export interface ActionExecuteData {
  [key: string]: any;
}

export interface ActionExecuteResponse {
  success: boolean;
  status?: number;
  data?: any;
  response_type?: ResponseType;
  error?: string;
}

export const HTTP_METHODS: { value: HttpMethod; label: string; color: string }[] = [
  { value: 'GET', label: 'GET', color: 'bg-blue-500' },
  { value: 'POST', label: 'POST', color: 'bg-green-500' },
  { value: 'PUT', label: 'PUT', color: 'bg-yellow-500' },
  { value: 'DELETE', label: 'DELETE', color: 'bg-red-500' },
  { value: 'PATCH', label: 'PATCH', color: 'bg-purple-500' },
];

export const RESPONSE_TYPES: { value: ResponseType; label: string; description: string }[] = [
  { value: 'modal', label: 'Modal', description: 'Display response in a dialog' },
  { value: 'toast', label: 'Toast', description: 'Show quick notification' },
  { value: 'page', label: 'Page', description: 'Navigate to new page' },
];

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export const PAYLOAD_TEMPLATE_VARIABLES = [
  '{{user.id}}',
  '{{user.username}}',
  '{{user.email}}',
  '{{timestamp}}',
  '{{date}}',
  '{{datetime}}',
  '{{random}}',
];

export const COLOR_THEMES: Record<ColorTheme, { background: string; text: string; gradient?: string }> = {
  ocean: { 
    background: 'bg-blue-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-cyan-500 to-blue-500' 
  },
  forest: { 
    background: 'bg-green-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500' 
  },
  sunset: { 
    background: 'bg-orange-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-orange-500 to-red-500' 
  },
  berry: { 
    background: 'bg-purple-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500' 
  },
  rose: { 
    background: 'bg-pink-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-pink-500 to-rose-500' 
  },
  slate: { 
    background: 'bg-gray-600', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-gray-600 to-gray-700' 
  },
  emerald: { 
    background: 'bg-teal-500', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-teal-500 to-cyan-500' 
  },
  amber: { 
    background: 'bg-amber-500', 
    text: 'text-black', 
    gradient: 'bg-gradient-to-r from-amber-400 to-orange-500' 
  },
  indigo: { 
    background: 'bg-indigo-600', 
    text: 'text-white', 
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600' 
  },
  custom: { 
    background: 'bg-gray-500', 
    text: 'text-white' 
  },
};
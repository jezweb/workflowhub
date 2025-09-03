import { ColorTheme, ButtonStyle } from '@/lib/appearance';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ResponseType = 'modal' | 'page' | 'toast';
export type OnSuccessAction = 'silent' | 'toast' | 'modal' | 'navigate' | 'refresh';

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

// Re-export COLOR_THEMES from shared lib for backward compatibility
export { COLOR_THEMES } from '@/lib/appearance';
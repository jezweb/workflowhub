export type FieldWidth = 'full' | '1/2' | '1/3' | '1/4';

export type FieldType = 
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'url'
  | 'tel'
  | 'heading'
  | 'separator'
  | 'html'
  | 'hidden';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  width: FieldWidth;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  // For heading field
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  // For HTML field
  htmlContent?: string;
  // For hidden field
  defaultValue?: string;
}

export type ResponseType = 'toast' | 'modal' | 'redirect' | 'html';

export interface AppearanceSettings {
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'sm' | 'default' | 'lg';
  buttonFullWidth?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
}

export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  webhookUrl?: string;
  webhookMethod?: 'GET' | 'POST' | 'PUT';
  emailNotification?: string;
  responseType?: ResponseType;
  r2Bucket?: string;
  turnstileEnabled?: boolean;
  turnstileSiteKey?: string;
  embedAllowed?: boolean;
  allowedDomains?: string;
  appearanceSettings?: AppearanceSettings;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  is_public: boolean;
  response_type?: ResponseType;
  r2_bucket?: string;
  turnstile_enabled?: boolean;
  turnstile_site_key?: string;
  embed_allowed?: boolean;
  allowed_domains?: string;
  appearance_settings?: AppearanceSettings;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_by?: string;
  ip_address?: string;
  webhook_status?: 'pending' | 'success' | 'error' | 'skipped';
  webhook_response?: string;
  webhook_response_code?: number;
  webhook_executed_at?: string;
  webhook_duration_ms?: number;
  files?: string[]; // R2 file keys
  turnstile_validated?: boolean;
  turnstile_challenge_ts?: string;
  created_at: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: string; // JSON string of form structure
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
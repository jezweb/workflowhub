// Storage types for frontend

export interface StorageBucket {
  id: string;
  name: string;
  description?: string;
  provider: 'r2' | 's3';
  is_default: boolean;
  is_default_chat: boolean;
  is_default_forms: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface R2Config {
  bucket_name: string;
  use_binding?: boolean;
  account_id?: string;
  access_key_id?: string;
  secret_access_key?: string;
}

export interface S3Config {
  bucket_name: string;
  region: string;
  access_key_id: string;
  secret_access_key: string;
  endpoint?: string;
  force_path_style?: boolean;
}

export type StorageConfig = R2Config | S3Config;

export interface CreateBucketInput {
  name: string;
  description?: string;
  provider: 'r2' | 's3';
  is_default?: boolean;
  is_default_chat?: boolean;
  is_default_forms?: boolean;
  config: StorageConfig;
}

export interface UpdateBucketInput {
  name?: string;
  description?: string;
  provider?: 'r2' | 's3';
  is_default?: boolean;
  is_default_chat?: boolean;
  is_default_forms?: boolean;
  config?: StorageConfig;
}

export interface BucketDefaults {
  general?: string;
  chat?: string;
  forms?: string;
}